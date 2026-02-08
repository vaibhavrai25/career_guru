const axios = require('axios');
const pdf = require('pdf-parse');
const https = require('https');
const Profile = require('../models/Profile');
const ResumeAnalysis = require('../models/ResumeAnalysis');

exports.analyzeResume = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile?.resumeUrl) return res.status(400).json({ message: 'Resume not found' });

    const pdfBuffer = await new Promise((resolve) => {
      https.get(profile.resumeUrl, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      });
    });

    const pdfData = await pdf(pdfBuffer);
    const hfResponse = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      { inputs: `Analyze SDE resume and return JSON {ats_score, skills_found[], missing_skills[], suggestions[]}: ${pdfData.text}` },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );

    let aiText = hfResponse.data[0].generated_text;
    const aiJson = JSON.parse(aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1));

    const analysis = await ResumeAnalysis.findOneAndUpdate(
      { userId: req.user._id },
      { ...aiJson, userId: req.user._id },
      { upsert: true, new: true }
    );
    res.json(analysis);
  } catch (err) { res.status(500).json({ error: "AI processing failed. Please ensure your .env HF_API_KEY is valid." }); }
};