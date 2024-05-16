import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define a type for individual analysis results
type AnalysisResult = {
  fileName: string;
  size: number;
  review: string;
};

// Function to recursively read directories and process relevant files
async function analyzeDirectory(directoryPath: string): Promise<AnalysisResult[]>  {
  const items = fs.readdirSync(directoryPath);
  const analysisResults: AnalysisResult[] = []; // Define the array with the type

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);

    if (fs.lstatSync(itemPath).isDirectory()) {
      // Recursively analyze sub-directory
      const subDirectoryResults = await analyzeDirectory(itemPath);
      analysisResults.push(...subDirectoryResults);
    } else if (item.endsWith('.php') || item.endsWith('.module') || item.endsWith('.theme')) {
      // Read and analyze relevant files
      const content = fs.readFileSync(itemPath, 'utf-8');
      let analysisResponse;

      try {
        analysisResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are a proficient code reviewer." },
            { role: "user", content: `Please review the following Drupal module code:\n\n${content}` },
          ],
        });
      } catch (error) {
        console.error("OpenAI API response error:", error);
        throw new Error("Error with OpenAI API request");
      }

      const analysis = {
        fileName: itemPath,
        size: fs.statSync(itemPath).size,
        review: analysisResponse.choices[0]?.message?.content || "No review available",
      };

      analysisResults.push(analysis);
    }
  }

  return analysisResults;
}

export async function POST(req: NextRequest) {
  const { path: rootPath } = await req.json();

  try {
    // Check if the directory exists
    if (!fs.existsSync(rootPath)) {
      return new Response('Directory not found', { status: 404 });
    }

    // Recursively analyze the given directory
    const moduleAnalyses = await analyzeDirectory(rootPath);

    const validAnalyses = moduleAnalyses.filter(Boolean);

    // Generate technical documentation in markdown format
    const technicalDocumentationMarkdown = validAnalyses.map(({ fileName, size, review }) => {
      return `### File: ${fileName}\n- Size: ${size}\n- Review: ${review}`;
    }).join('\n\n');

    return new Response(technicalDocumentationMarkdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error("Error during analysis:", error);
    return new Response('An error occurred during analysis', { status: 500 });
  }
}