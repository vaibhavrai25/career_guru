const axios = require('axios');
const pdf = require('pdf-parse');
const https = require('https');
const Profile = require('../models/Profile');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const analyzeResume = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile || !profile.resumeUrl) {
      return res.status(400).json({ message: 'Resume not uploaded' });
    }

    // 🔹 Download PDF from Cloudinary
    const pdfBuffer = await new Promise((resolve, reject) => {
      https.get(profile.resumeUrl, (response) => {
        const data = [];
        response.on('data', (chunk) => data.push(chunk));
        response.on('end', () => resolve(Buffer.concat(data)));
        response.on('error', reject);
      });
    });

    // 🔹 Extract text
    const pdfData = await pdf(pdfBuffer);
    const resumeText = pdfData.text;

    // 🔹 Send to HuggingFace
    const hfResponse = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        inputs: `
Analyze this resume and return JSON:

${resumeText}

Return strictly JSON:
{
  "ats_score": number,
  "skills_found": [],
  "missing_skills_for_sde": [],
  "experience_level": "",
  "suggestions": []
}
        `,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    const aiText = hfResponse.data[0].generated_text;

    const jsonStart = aiText.indexOf('{');
    const jsonEnd = aiText.lastIndexOf('}');
    const aiJson = JSON.parse(aiText.slice(jsonStart, jsonEnd + 1));

    // 🔹 Save in DB
    await ResumeAnalysis.findOneAndUpdate(
      { userId: req.user._id },
      { ...aiJson, userId: req.user._id },
      { upsert: true, new: true }
    );

    res.json(aiJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = { analyzeResume };