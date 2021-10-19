import axios from "axios";

const handler = async (req, res) => {
  try {
    const { data } = await axios.get("https://api.twitter.com/2/users/2375288959/tweets", {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
      },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e });
  }
};

export default handler;
