import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["convex/_generated/**", ".next/**", "node_modules/**"]
  },
  ...nextVitals
];

export default eslintConfig;
