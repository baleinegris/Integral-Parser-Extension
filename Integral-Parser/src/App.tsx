import React, { useState } from 'react'
import './App.css'

import OpenAI from "openai";

export function App() {
  const openai = new OpenAI({apiKey : import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true});
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [parsed, setParsed] = useState<boolean>(false);
  const [wolframURL, setWolframURL] = useState<string>("");
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          setMainImage(base64String);
        };
        reader.readAsDataURL(blob!);
      }
  };
}

  async function handleParseImage() {
    if (!mainImage) {
      return;
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {role: "system", 
          content: `Your job is to parse images of math integrals and possibly provided context,  
          and to return a URL to "https://www.wolframalpha.com/" with "/input=" and then the plain 
          // text integral formatted into the URL following this example: "https://www.wolframalpha.com/input?i=integrate%28integrate%28e%5E%28x+-+y%29%2C+x%2C+0%2C+2%29%2C+y%2C+-2%2C+-1%29". 
          // Return only the URL as a string, with no other text.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Return the URL to Wolfram Alpha based on this integral" },
            {
              type: "image_url",
              image_url: {
                "url": mainImage,
              },
            },
          ],
        },
      ],
      store: true,
    });
    console.log(response);
    if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      setWolframURL(response.choices[0].message.content);
      setParsed(true);
    }
  }

  return (
    <>
        <h1>Integral Parser for Wolfram Alpha</h1>
        <textarea onPaste={handlePaste} placeholder="Paste your integral here" />
        <button onClick={handleParseImage}>Parse Image</button>
        {mainImage && <img src={mainImage} alt="Integral" />}
        {parsed && (
          <a href={wolframURL} target='_blank'>
            Click here to view the integral on Wolfram Alpha
          </a>
        )}
    </>
  )
}

export default App
