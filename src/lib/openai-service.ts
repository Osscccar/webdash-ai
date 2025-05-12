// src/lib/openai-service.ts

import { OpenAIStream } from "ai";

interface AIGeneratedContent {
  businessType: string;
  businessName: string;
  businessDescription: string;
  websiteTitle: string;
  websiteDescription: string;
  websiteKeyphrase: string;
  suggestedColors: {
    primaryColor: string;
    secondaryColor: string;
    backgroundDark: string;
  };
  suggestedFont: string;
  pages: {
    title: string;
    description: string;
    sections: {
      section_title: string;
      section_description: string;
    }[];
  }[];
}

// Available font options
const AVAILABLE_FONTS = [
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Raleway",
  "Oswald",
  "Playfair Display",
  "Merriweather",
  "Source Sans Pro",
];

export async function generateWebsiteContent(
  prompt: string
): Promise<AIGeneratedContent> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a website design expert. Generate website content based on a user prompt.
            The response should be in JSON format with the following structure:
            {
              "businessType": "one-word business type like 'restaurant', 'ecommerce', 'blog', etc.",
              "businessName": "a creative business name",
              "businessDescription": "a compelling 1-2 sentence description",
              "websiteTitle": "an SEO-friendly title for the site",
              "websiteDescription": "a brief SEO description",
              "websiteKeyphrase": "a targeted keyword/phrase",
              "suggestedColors": {
                "primaryColor": "#hexcode",
                "secondaryColor": "#hexcode",
                "backgroundDark": "#hexcode"
              },
              "suggestedFont": "choose one from: ${AVAILABLE_FONTS.join(", ")}",
              "pages": [
                {
                  "title": "page title",
                  "description": "page description",
                  "sections": [
                    {
                      "section_title": "section title",
                      "section_description": "section content"
                    }
                  ]
                }
              ]
            }
            
            Always include at least 4 pages (Home, About, Services/Products, Contact). Each page should have 2-4 sections.
            If the business is an ecommerce, add a "Shop" page. If it's a restaurant, add a "Menu" page.
            The business type must be a single word.
            Colors should be aesthetically pleasing and match the business theme.
            Descriptions should be compelling and marketable.`,
          },
          {
            role: "user",
            content: `Create website content for: ${prompt}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content.trim());

    // Validate font choice
    if (!AVAILABLE_FONTS.includes(generatedContent.suggestedFont)) {
      // Default to Montserrat if invalid font
      generatedContent.suggestedFont = "Montserrat";
    }

    return generatedContent;
  } catch (error) {
    console.error("Error generating AI content:", error);

    // Provide fallback content in case of error
    return {
      businessType: "business",
      businessName: "WebDash Business",
      businessDescription:
        "A professional online presence for your growing business.",
      websiteTitle: "WebDash Business | Professional Services",
      websiteDescription:
        "Professional online services for businesses of all sizes.",
      websiteKeyphrase: "business services",
      suggestedColors: {
        primaryColor: "#f58327",
        secondaryColor: "#4a5568",
        backgroundDark: "#212121",
      },
      suggestedFont: "Montserrat",
      pages: [
        {
          title: "Home",
          description: "Welcome to WebDash Business",
          sections: [
            {
              section_title: "Hero Section",
              section_description:
                "Welcome to WebDash Business, your partner for professional services.",
            },
            {
              section_title: "Services Overview",
              section_description:
                "Discover our range of professional services.",
            },
          ],
        },
        {
          title: "About",
          description: "Learn about our company",
          sections: [
            {
              section_title: "Our Story",
              section_description: "The story behind our company and mission.",
            },
            {
              section_title: "Our Team",
              section_description: "Meet the professionals behind our success.",
            },
          ],
        },
        {
          title: "Services",
          description: "Our professional services",
          sections: [
            {
              section_title: "Service 1",
              section_description:
                "Description of our first professional service.",
            },
            {
              section_title: "Service 2",
              section_description:
                "Description of our second professional service.",
            },
          ],
        },
        {
          title: "Contact",
          description: "Get in touch with us",
          sections: [
            {
              section_title: "Contact Form",
              section_description: "Send us a message to get started.",
            },
            {
              section_title: "Contact Information",
              section_description: "Our address, phone, and email details.",
            },
          ],
        },
      ],
    };
  }
}
