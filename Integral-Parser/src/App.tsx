import React, { useState } from 'react'
import './App.css'
import githubIcon from '/githubIcon.png'
import { PropagateLoader } from 'react-spinners';

import OpenAI from "openai";

export function App() {
  const openai = new OpenAI({apiKey : import.meta.env.VITE_OPENAI_KEY, dangerouslyAllowBrowser: true});
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [context, setContext] = useState<Array<string>>([]);
  const [parsed, setParsed] = useState<boolean>(false);
  const [wolframURL, setWolframURL] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  function handlePasteMain(e: React.ClipboardEvent<HTMLTextAreaElement>) {
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

  function handlePasteContext(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          setContext((prev) => [...prev, base64String]);
          };
        reader.readAsDataURL(blob!);
        }
    };
    console.log(context);
  }

  async function handleParseImage() {
    if (!mainImage) {
      return;
    }

    setLoading(true);
    const contextImages = context.map((encodedImg) => (
      {
        type: "image_url",
        image_url: {
          "url": encodedImg,
        },
      }
    )
    )

    const messages = [
      {
        role: "system",
        content: `Your job is to parse images of math integrals and possibly provided context,
        and to return a URL to "https://www.wolframalpha.com/" with "/input=" and then the plain 
        text integral formatted into the URL following this example: "https://www.wolframalpha.com/input?i=integrate%28integrate%28e%5E%28x+-+y%29%2C+x%2C+0%2C+2%29%2C+y%2C+-2%2C+-1%29". 
        Return only the URL as a string, with no other text.`
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
          ...contextImages,
        ],
      },
    ];


    setMainImage(null);
    setContext([]);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // @ts-ignore
      messages: messages,
      store: true,
    });
    console.log(response);
    if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      setWolframURL(response.choices[0].message.content);
      setParsed(true);
      setLoading(false);
    }
  }

  function removeIntegral() {
    setMainImage(null);
  }

  function removeContext(index: number) {
    setContext((prev) => prev.filter((_, i) => i !== index
    ));
  }

  return (
    <div className='flex'>
        <h1>Integral Parser for Wolfram Alpha</h1>
        <div className='flex'>
          <textarea onPaste={handlePasteMain} placeholder="Paste your integral here" />
          <textarea onPaste={handlePasteContext} placeholder="Paste any context needed here (function definitions, constants...)" />
          <button onClick={handleParseImage}>Parse Image</button>
        </div>
        {mainImage && 
        <>
          <div className='title'>Integral Provided:</div>
          <div className='imageContainer'>
            <img src={mainImage} height={75} width='auto' alt="Integral" />
            <div className='X' onClick={removeIntegral}>X</div>
          </div>
        </>
        }
        {context && context.length > 0 && <div className='title'>Context Provided:</div>}
        {context.map((img, index) => (
          <div key={index} className='imageContainer'>
            <img src={img} height={75} width='auto' alt="Context" />
            <div className='X' onClick={() => removeContext(index)}>X</div>
          </div>
        ))}
        <PropagateLoader color={"#ffffff"} loading={loading} />
        {parsed && (
          <a href={wolframURL} target='_blank' className='wolframLink'>
            Click here to view the integral on Wolfram Alpha
          </a>
        )}
        <a href='https://github.com/baleinegris' className='githubLink'> <img src={githubIcon} height={50} width={50}/> </a>
    </div>
  )
}

export default App
