import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      className="px-2 py-1 border rounded"
    >
      <option value="es">🇪🇦</option>
      <option value="en">🇺🇸</option>
      <option value="fr">🇫🇷</option>
    </select>
  );
};

export default LanguageSelector;
