import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'src/**/*'] // we only care about rules here
  },
  {
    plugins: {
      '@firebase/eslint-plugin-security-rules': firebaseRulesPlugin
    },
    rules: {
      // we can add rules later if needed
    }
  }
];
