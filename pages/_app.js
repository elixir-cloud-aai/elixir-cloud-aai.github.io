import Layout from "../components/Layout";
import "../styles/globals.css";

const MyApp = ({ Component, pageProps }) => {
  return (
    <Layout {...pageProps}>
      <Component />
    </Layout>
  );
};

export default MyApp;
