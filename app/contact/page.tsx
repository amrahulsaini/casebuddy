'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from 'lucide-react';
import styles from './contact.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Get In Touch</h1>
        <p className={styles.heroSubtitle}>
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </section>

      {/* Contact Info Cards */}
      <section className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <MapPin className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Our Location</h3>
            <p className={styles.infoText}>
              CaseBuddy<br />
              Rajgarh, Rajasthan<br />
              331023, India
            </p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Phone className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Phone Number</h3>
            <p className={styles.infoText}>
              <a href="tel:+918107624752" className={styles.link}>+91 81076 24752</a>
            </p>
            <p className={styles.infoSubtext}>Mon - Sat, 9 AM - 7 PM</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Mail className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Email Address</h3>
            <p className={styles.infoText}>
              <a href="mailto:info@casebuddy.co.in" className={styles.link}>info@casebuddy.co.in</a>
            </p>
            <p className={styles.infoSubtext}>We'll reply within 24 hours</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <Clock className={styles.icon} size={32} />
            </div>
            <h3 className={styles.infoTitle}>Business Hours</h3>
            <p className={styles.infoText}>
              Monday - Saturday<br />
              9:00 AM - 7:00 PM IST
            </p>
            <p className={styles.infoSubtext}>Closed on Sundays</p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <MessageSquare className={styles.formIcon} size={48} />
            <h2 className={styles.formTitle}>Send Us a Message</h2>
            <p className={styles.formSubtitle}>
              Fill out the form below and our team will get back to you shortly
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="John Doe"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={styles.input}
                  placeholder="How can we help?"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className={styles.textarea}
                placeholder="Tell us more about your inquiry..."
                rows={6}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              <Send size={20} />
              Send Message
            </button>

            {submitted && (
              <div className={styles.successMessage}>
                ✓ Message sent successfully! We'll get back to you soon.
              </div>
            )}
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>How long does delivery take?</h3>
            <p className={styles.faqAnswer}>
              We deliver across India within 7-10 business days. You'll receive a tracking number once your order ships.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>What is your return policy?</h3>
            <p className={styles.faqAnswer}>
              We offer a 7-day easy return policy. If you're not satisfied with your purchase, you can return it within 7 days for a full refund.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>Do you offer custom designs?</h3>
            <p className={styles.faqAnswer}>
              Yes! You can customize phone cases with your own photos, text, and designs. Visit our customization page to get started.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>Which phone models do you support?</h3>
            <p className={styles.faqAnswer}>
              We support all major brands including iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, and more. Check our shop for your model.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>Is there a minimum order value?</h3>
            <p className={styles.faqAnswer}>
              No minimum order value! However, orders above ₹499 qualify for free shipping across India.
            </p>
          </div>

          <div className={styles.faqCard}>
            <h3 className={styles.faqQuestion}>How can I track my order?</h3>
            <p className={styles.faqAnswer}>
              Once your order ships, you'll receive a tracking number via email and SMS. Use it to track your package in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className={styles.mapSection}>
        <h2 className={styles.sectionTitle}>Visit Us</h2>
        <div className={styles.mapContainer}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113647.38526644991!2d75.29579!3d27.2380!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396da27ee6f90a85%3A0x9ab8c0a6b9d0a3c7!2sRajgarh%2C%20Rajasthan%20331023!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={styles.map}
          />
        </div>
      </section>
    </div>
  );
}
