'use client';

import { MessageCircle } from 'lucide-react';
import styles from './WhatsAppButton.module.css';

export default function WhatsAppButton() {
  const phoneNumber = '918107624752'; // Replace with actual WhatsApp number
  const message = 'Hi! I have a question about CaseBuddy products.';
  
  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <button 
      onClick={handleClick}
      className={styles.whatsappButton}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={28} />
      <span className={styles.tooltip}>Chat with us</span>
    </button>
  );
}
