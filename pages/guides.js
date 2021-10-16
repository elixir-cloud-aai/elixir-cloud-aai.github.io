import Head from "next/head";
import GuidesComponent from "../components/Guides";

const Guides = () => {
  return (
    <div>
      <Head>
        <title>Guides & FAQs</title>
      </Head>
      <GuidesComponent></GuidesComponent>
    </div>
  );
};

export default Guides;
