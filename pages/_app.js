import { Container } from "next/app";
import Layout from "../components/Layout";
import "../styles/globals.css";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";

const MyApp = ({ Component, pageProps }) => {
  return (
    <>
      <DefaultSeo {...SEO} />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
};

export default MyApp;
