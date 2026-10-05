export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured."
      });
    }

    /*
      Frontend FormData bhej raha hai.
      Is function mein YouTube URL ya uploaded file receive hogi.
    */

    const contentType = req.headers["content-type"] || "";

    let youtubeUrl = "";
    let uploadedFile = null;

    if (contentType.includes("multipart/form-data")) {

      /*
        Vercel/Node request ko manually parse karne ke bajay
        abhi simple JSON endpoint use karenge.
      */

      return res.status(400).json({
        error:
          "Upload processing setup next step mein connect hoga. Pehle API connection complete karo."
      });

    } else {

      let body = req.body;

      if (typeof body === "string") {
        body = JSON.parse(body);
      }

      youtubeUrl = body?.youtubeUrl || "";
    }


    if (!youtubeUrl) {
      return res.status(400).json({
        error: "YouTube URL required."
      });
    }


    const prompt = `
You are Padhnex, an AI study assistant for students.

The student provided this YouTube URL:

${youtubeUrl}

Create useful study material for the student.

Return ONLY valid JSON in this exact structure:

{
  "summary": "short clear summary",
  "points": [
    "important point 1",
    "important point 2",
    "important point 3",
    "important point 4",
    "important point 5"
  ],
  "notes": "detailed easy-to-understand notes",
  "mcqs": [
    {
      "question": "question",
      "a": "option A",
      "b": "option B",
      "c": "option C",
      "d": "option D",
      "answer": "A"
    }
  ]
}

Use simple language suitable for students.
Do not invent information that is not available.
`;


    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({

          model: "gpt-5",

          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: prompt
                }
              ]
            }
          ]

        })
      }
    );


    const data = await response.json();


    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI API request failed."
      });
    }


    const output =
      data.output_text || "";


    let result;

    try {

      result = JSON.parse(output);

    } catch {

      return res.status(500).json({
        error:
          "AI returned an invalid response. Please try again."
      });

    }


    return res.status(200).json(result);


  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Server error. Please try again."
    });

  }
  }
