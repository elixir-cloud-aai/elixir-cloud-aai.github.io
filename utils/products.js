const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const getProducts = async (req, res) => {
  try {
    var payload = {
      path: `search`,
      method: `POST`,
      body: {
        query: "Products",
      },
    };
    var data = await notion.request(payload);
    const productsDBId = data.results[0].id;
    payload = {
      path: `databases/${productsDBId}/query`,
      method: `POST`,
    };
    var { results } = await notion.request(payload);
    results = results.map((result) => {
      return {
        id: result.id,
        title: result.properties.Name.title[0].text.content,
        icon: result.properties.Icon.files[0].name,
        description: result.properties.Description.rich_text[0]
          ? result.properties.Description.rich_text[0].text.content
          : "",
        createdAt: result.created_time,
        updatedAt: result.last_edited_time,
      };
    });
    return results;
  } catch (e) {
    return { message: "Server error", error: e };
  }
};

export default getProducts;
