import React, { useState, useEffect } from "react";

// Estilos en línea para el componente
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    padding: "4rem 1rem",
    backgroundColor: "#f5f5f7",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1d1d1f",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#86868b",
    fontWeight: 400,
  },
  toggleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2.5rem",
  },
  toggleLabel: {
    margin: "0 1rem",
    fontSize: "1rem",
    color: "#1d1d1f",
    fontWeight: 500,
  },
  toggle: {
    position: "relative",
    display: "inline-block",
    width: "60px",
    height: "32px",
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ccc",
    transition: ".4s",
    borderRadius: "34px",
  },
  toggleSliderBefore: {
    position: "absolute",
    content: '""',
    height: "24px",
    width: "24px",
    left: "4px",
    bottom: "4px",
    backgroundColor: "white",
    transition: ".4s",
    borderRadius: "50%",
  },
  toggleInputChecked: {
    backgroundColor: "#0071e3",
  },
  toggleInputCheckedBefore: {
    transform: "translateX(26px)",
  },
  plansContainer: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "2rem",
    maxWidth: "1200px",
  },
  planCard: {
    backgroundColor: "white",
    borderRadius: "18px",
    padding: "2rem",
    width: "320px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    display: "flex",
    flexDirection: "column",
    opacity: 0,
    transform: "translateY(20px)",
  },
  planCardRecommended: {
    border: "2px solid #0071e3",
    transform: "scale(1.03)",
    boxShadow: "0 8px 30px rgba(0, 113, 227, 0.15)",
    position: "relative",
    overflow: "hidden",
  },
  recommendedBadge: {
    position: "absolute",
    top: "0",
    right: "0",
    backgroundColor: "#0071e3",
    color: "white",
    padding: "0.5rem 1.5rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    borderBottomLeftRadius: "12px",
  },
  planName: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#1d1d1f",
    marginBottom: "1.5rem",
  },
  priceContainer: {
    marginBottom: "1.5rem",
  },
  originalPrice: {
    fontSize: "1.1rem",
    color: "#86868b",
    textDecoration: "line-through",
    marginBottom: "0.25rem",
  },
  currentPrice: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1d1d1f",
    marginBottom: "0.5rem",
  },
  priceNote: {
    fontSize: "0.9rem",
    color: "#86868b",
  },
  featuresList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 2rem 0",
    flexGrow: 1,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1rem",
    fontSize: "1rem",
    color: "#1d1d1f",
  },
  checkIcon: {
    color: "#0071e3",
    marginRight: "0.75rem",
    fontSize: "1.2rem",
  },
  button: {
    backgroundColor: "#0071e3",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    textAlign: "center",
  },
  buttonHover: {
    backgroundColor: "#0077ed",
  },
};

// Interfaces TypeScript
interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isRecommended?: boolean;
}

interface PricingTableProps {
  plans: Plan[];
}

const PricingTable: React.FC<PricingTableProps> = ({ plans }) => {
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [isHoveredButton, setIsHoveredButton] = useState<number | null>(null);

  // Animación de entrada para las tarjetas
  useEffect(() => {
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll(".plan-card");
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.setAttribute(
            "style",
            "opacity: 1; transform: translateY(0); transition: opacity 0.5s ease, transform 0.5s ease;"
          );
        }, index * 150);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleChange = () => {
    setIsAnnual(!isAnnual);
  };

  const formatPrice = (price: number): string => {
    return `€${(price / 100).toFixed(2)}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Choisissez votre plan</h2>
        <p style={styles.subtitle}>Prix de lancement – Offre Early Bird</p>
      </div>

      <div style={styles.toggleContainer}>
        <span style={styles.toggleLabel}>Mensuel</span>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={isAnnual}
            onChange={handleToggleChange}
            style={styles.toggleInput}
          />
          <span
            style={{
              ...styles.toggleSlider,
              ...(isAnnual ? styles.toggleInputChecked : {}),
            }}
          >
            <span
              style={{
                ...styles.toggleSliderBefore,
                ...(isAnnual ? styles.toggleInputCheckedBefore : {}),
              }}
            />
          </span>
        </label>
        <span style={styles.toggleLabel}>Annuel</span>
      </div>

      <div style={styles.plansContainer}>
        {plans.map((plan, index) => (
          <div
            key={index}
            className="plan-card"
            style={{
              ...styles.planCard,
              ...(plan.isRecommended ? styles.planCardRecommended : {}),
              ...(isHoveredButton === index
                ? {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                  }
                : {}),
            }}
            onMouseEnter={() => setIsHoveredButton(index)}
            onMouseLeave={() => setIsHoveredButton(null)}
          >
            {plan.isRecommended && (
              <div style={styles.recommendedBadge}>Recommandé</div>
            )}

            <h3 style={styles.planName}>{plan.name}</h3>

            <div style={styles.priceContainer}>
              <p style={styles.originalPrice}>
                {formatPrice(plan.monthlyPrice)}/mois
              </p>
              <p style={styles.currentPrice}>
                {isAnnual
                  ? formatPrice(plan.annualPrice)
                  : formatPrice(plan.monthlyPrice)}
                <span style={{ fontSize: "1rem", fontWeight: "normal" }}>
                  {isAnnual ? "/an" : "/mois"}
                </span>
              </p>
              {isAnnual && (
                <p style={styles.priceNote}>
                  Économisez{" "}
                  {Math.round(1 - plan.annualPrice / (plan.monthlyPrice * 12))}%
                </p>
              )}
            </div>

            <ul style={styles.featuresList}>
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} style={styles.featureItem}>
                  <span style={styles.checkIcon}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              style={{
                ...styles.button,
                ...(isHoveredButton === index ? styles.buttonHover : {}),
              }}
              onMouseEnter={() => setIsHoveredButton(index)}
              onMouseLeave={() => setIsHoveredButton(null)}
            >
              Essayer gratuitement 14 jours sans CB
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Datos de ejemplo para los planes
const samplePlans: Plan[] = [
  {
    name: "Lite",
    monthlyPrice: 1190,
    annualPrice: 1190,
    features: [
      "Accès basique à la plateforme",
      "Support par email",
      "5 modèles IA disponibles",
      "100 requêtes/mois",
    ],
  },
  {
    name: "Starter",
    monthlyPrice: 3600,
    annualPrice: 3600,
    features: [
      "Accès complet à la plateforme",
      "Support prioritaire 24/7",
      "IA illimitée",
      "Tous les modèles disponibles",
      "Formation en ligne incluse",
      "Analytics de base",
    ],
    isRecommended: true,
  },
  {
    name: "Pro",
    monthlyPrice: 5400,
    annualPrice: 5400,
    features: [
      "Toutes les fonctionnalités Starter",
      "Onboarding personnalisé",
      "Analytics avancés",
      "Modèle personnalisé",
      "Accès aux bêta tests",
      "Dédié account manager",
    ],
  },
];

// Componente de aplicación
const App: React.FC = () => {
  return <PricingTable plans={samplePlans} />;
};

export default App;
