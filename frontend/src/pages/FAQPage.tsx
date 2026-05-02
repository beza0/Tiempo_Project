import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/layout/PageLayout";
import type { PageType } from "../App";
import { HelpCircle, ChevronDown, Search } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { PATHS } from "../navigation/paths";
import "../styles/faq.css";

interface FAQPageProps {
  onNavigate?: (page: PageType) => void;
}

export function FAQPage({ onNavigate }: FAQPageProps) {
  const { t } = useLanguage();
  const fp = t.faqPage;
  const navigate = useNavigate();

  const [openId, setOpenId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFaqs = fp.items.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      faq.q.toLowerCase().includes(q) ||
      faq.a.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const goContact = () => {
    navigate(PATHS.contact);
  };

  return (
    <PageLayout onNavigate={onNavigate}>
      <div className="faq-page">
        <div className="faq-content">
          <section className="faq-hero">
            <div className="faq-hero-container">
              <div className="faq-hero-icon">
                <HelpCircle className="icon-large" aria-hidden />
              </div>
              <h1 className="faq-hero-title">{fp.heroTitle}</h1>
              <p className="faq-hero-subtitle">{fp.heroSubtitle}</p>
            </div>
          </section>

          <section className="faq-controls">
            <div className="faq-controls-container">
              <div className="faq-search">
                <Search className="faq-search-icon" aria-hidden />
                <input
                  type="search"
                  placeholder={fp.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="faq-search-input"
                  autoComplete="off"
                />
              </div>

              <div className="faq-categories">
                {fp.categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`faq-category-button ${activeCategory === category.id ? "active" : ""}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="faq-list-section">
            <div className="faq-list-container">
              {filteredFaqs.length === 0 ? (
                <div className="faq-empty">
                  <HelpCircle className="faq-empty-icon" aria-hidden />
                  <p className="faq-empty-text">{fp.emptyText}</p>
                </div>
              ) : (
                <div className="faq-list">
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} className="faq-item">
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="faq-question-button"
                        aria-expanded={openId === faq.id}
                      >
                        <span className="faq-question">{faq.q}</span>
                        <ChevronDown
                          className={`faq-chevron ${openId === faq.id ? "open" : ""}`}
                          aria-hidden
                        />
                      </button>
                      <div
                        className={`faq-answer ${openId === faq.id ? "open" : ""}`}
                      >
                        <div className="faq-answer-inner">
                          <p className="faq-answer-text">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="faq-contact">
            <div className="faq-contact-container">
              <h2 className="faq-contact-title">{fp.ctaTitle}</h2>
              <p className="faq-contact-text">{fp.ctaText}</p>
              <button
                type="button"
                className="faq-contact-button"
                onClick={goContact}
              >
                {fp.ctaButton}
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
