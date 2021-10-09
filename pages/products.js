import Head from "next/head";
import { server } from "../config";
import axios from "axios";
import ProductsComponent from "../components/Products";

const Products = ({ products }) => {
  return (
    <>
      <Head>
        <title>Products</title>
      </Head>
      <ProductsComponent products></ProductsComponent>
    </>
  );
};

export const getStaticProps = async () => {
  return {
    props: {},
  };
};

export default Products;
