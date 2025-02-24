import { GoogleGenerativeAI } from "@google/generative-ai";

// let genAI = null;
// let chatSession = null;

// const initializeChatbot = async () => {
//   if (!genAI || !chatSession) {
//     try {
//       const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
//       genAI = new GoogleGenerativeAI(apiKey).getGenerativeModel({
//         model: "gemini-1.5-flash",
//         systemInstruction: `
//           Finance Bot Instructions
//           1. Introduction
//           Bot: "Hello! I'm your Finance Bot. I can help you plan your salary and manage your finances. Let's start by gathering some details about your income and expenses."
//           2. Collect User Details
//           Bot: "Please provide your monthly salary."
//           3. Budget Planning
//           Bot: "Based on your salary and expenses, I will suggest how to allocate your budget."
//           4. Expense Tracking
//           Bot: "Please categorize your expenses into needs, wants, and savings."
//           5. Savings Recommendations
//           Bot: "To help you achieve your savings goals, I recommend saving a percentage of your income each month."
//           6. Investment Advice
//           Bot: "If you're interested, I can suggest some basic investment options based on your savings."
//           7. Closing
//           Bot: "Thank you for using the Finance Bot. If you have any more questions or need further assistance, feel free to ask!"
//         `,
//       });

//       chatSession = genAI.startChat({ history: [] });
//     } catch (error) {
//       console.error("Error initializing chatbot:", error);
//     }
//   }
// };

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { userMessage, chatHistory } = req.body;

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `
          Finance Bot Instructions
          1. Introduction
          Bot: "Hello! I'm your Finance Bot. I can help you plan your salary and manage your finances. Let's start by gathering some details about your income and expenses."
          2. Collect User Details
          Bot: "Please provide your monthly salary."
          3. Budget Planning
          Bot: "Based on your salary and expenses, I will suggest how to allocate your budget."
          4. Expense Tracking
          Bot: "Please categorize your expenses into needs, wants, and savings."
          5. Savings Recommendations
          Bot: "To help you achieve your savings goals, I recommend saving a percentage of your income each month."
          6. Investment Advice
          Bot: "If you're interested, I can suggest some basic investment options based on your savings."
          7. Closing
          Bot: "Thank you for using the Finance Bot. If you have any more questions or need further assistance, feel free to ask!"`,
      });
      //   if (!genAI || !chatSession) await initializeChatbot();
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
      const chat = chatHistory.slice(1).map((element) => {
        return {
          role: element.role,
          parts: [
            {
              text: element.parts[0],
            },
          ],
        };
      });
      console.log(chat);
      const session = model.startChat({
        generationConfig,
        history: chat,
      });

      const result = await session.sendMessage(userMessage);
      const responseText = result.response.text();

      res.status(200).json({ responseText });
    } catch (error) {
      console.error("Error in chatbot response:", error);
      res.status(500).json({ error: "Failed to communicate with Finance Bot" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
