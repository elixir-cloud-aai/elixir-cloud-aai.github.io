const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const handler = async (req, res) => {
  try {
    var payload = {
      path: `blocks/${req.query.id}/children`,
      method: `GET`,
    };
    var { results } = await notion.request(payload);
    results = results.map((result) => {
      if (result.paragraph.text[0]) {
        return {
          id: result.id,
          text: result.paragraph.text[0].text.content,
          createdAt: result.created_time,
        };
      }
    });
    res.status(200).json(results);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e });
  }
};

export default handler;
