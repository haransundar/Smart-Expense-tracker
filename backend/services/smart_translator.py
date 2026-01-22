import re
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from models import MerchantPattern, Category

class SmartTranslator:
    """Converts cryptic bank text into readable merchant names and categories"""
    
    def __init__(self, db: Session):
        self.db = db
        self.patterns = self._load_patterns()
    
    def _load_patterns(self):
        """Load merchant patterns from database"""
        return self.db.query(MerchantPattern).all()
    
    def translate(self, raw_text: str) -> Tuple[Optional[str], Optional[int]]:
        """
        Translate raw bank text to merchant name and category
        Returns: (merchant_name, category_id)
        """
        if not raw_text:
            return None, None
        
        # Clean the text
        cleaned = raw_text.upper().strip()
        
        # Try pattern matching
        for pattern in self.patterns:
            if pattern.pattern.upper() in cleaned:
                return pattern.merchant_name, pattern.category_id
        
        # Fallback: Extract merchant from common formats
        merchant = self._extract_merchant_fallback(cleaned)
        return merchant, None
    
    def _extract_merchant_fallback(self, text: str) -> Optional[str]:
        """Extract merchant name from common bank text formats"""
        
        # UPI format: UPI-MERCHANT-1234-LOCATION
        upi_match = re.search(r'UPI[/-]([A-Z]+)', text)
        if upi_match:
            return upi_match.group(1).title()
        
        # Card format: POS MERCHANT LOCATION
        pos_match = re.search(r'POS\s+([A-Z\s]+?)(?:\s+\d|\s+[A-Z]{2,3}$)', text)
        if pos_match:
            return pos_match.group(1).strip().title()
        
        # IMPS/NEFT format
        imps_match = re.search(r'(?:IMPS|NEFT)[/-]([A-Z\s]+)', text)
        if imps_match:
            return imps_match.group(1).strip().title()
        
        # Return first meaningful word
        words = text.split()
        for word in words:
            if len(word) > 3 and word.isalpha():
                return word.title()
        
        return None
    
    def learn_pattern(self, raw_text: str, merchant_name: str, category_id: int):
        """Learn a new merchant pattern from user correction"""
        pattern_key = self._extract_pattern_key(raw_text)
        
        if pattern_key:
            existing = self.db.query(MerchantPattern).filter(
                MerchantPattern.pattern == pattern_key
            ).first()
            
            if not existing:
                new_pattern = MerchantPattern(
                    pattern=pattern_key,
                    merchant_name=merchant_name,
                    category_id=category_id,
                    confidence_score=0.9
                )
                self.db.add(new_pattern)
                self.db.commit()
                self.patterns = self._load_patterns()
    
    def _extract_pattern_key(self, text: str) -> Optional[str]:
        """Extract the key pattern from raw text"""
        cleaned = text.upper().strip()
        
        # Extract main merchant identifier
        for pattern in ['UPI-', 'POS ', 'IMPS-', 'NEFT-']:
            if pattern in cleaned:
                parts = cleaned.split(pattern)[1].split('-')[0].split()[0]
                return parts
        
        return None
