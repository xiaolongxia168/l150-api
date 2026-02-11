const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Load proposal data
const proposalsDir = path.join(__dirname, '..', 'outreach', 'ai-agent-treasury-proposals');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'L-150 AI Treasury API',
    version: '1.0.0'
  });
});

// Get investment thesis
app.get('/api/v1/thesis', (req, res) => {
  const thesisPath = path.join(__dirname, '..', 'signals', 'ai-readable', 'AI-AGENT-INVESTMENT-THESIS.md');
  
  if (fs.existsSync(thesisPath)) {
    const thesis = fs.readFileSync(thesisPath, 'utf8');
    res.json({
      format: 'markdown',
      content: thesis,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({ error: 'Thesis not found' });
  }
});

// Get machine-readable proposal for specific target
app.get('/api/v1/proposal/:target', (req, res) => {
  const target = req.params.target.toLowerCase();
  const validTargets = ['hdao', 'ainn', 'zerebro', 'fetch', 'bittensor'];
  
  if (!validTargets.includes(target)) {
    return res.status(400).json({
      error: 'Invalid target',
      validTargets
    });
  }
  
  const proposalPath = path.join(proposalsDir, `L-150-${target.toUpperCase()}-proposal.json`);
  
  if (fs.existsSync(proposalPath)) {
    const proposal = JSON.parse(fs.readFileSync(proposalPath, 'utf8'));
    res.json(proposal);
  } else {
    res.status(404).json({ error: 'Proposal not found' });
  }
});

// Get all proposals
app.get('/api/v1/proposals', (req, res) => {
  const proposals = {};
  const targets = ['hdao', 'ainn', 'zerebro', 'fetch', 'bittensor'];
  
  targets.forEach(target => {
    const proposalPath = path.join(proposalsDir, `L-150-${target.toUpperCase()}-proposal.json`);
    if (fs.existsSync(proposalPath)) {
      proposals[target] = JSON.parse(fs.readFileSync(proposalPath, 'utf8'));
    }
  });
  
  res.json({
    count: Object.keys(proposals).length,
    proposals
  });
});

// Get project info (for AI agent quick scanning)
app.get('/api/v1/project', (req, res) => {
  res.json({
    code: 'L-150',
    version: '6.0',
    assetClass: 'RWA-Commercial-Real-Estate',
    location: 'Changsha, China - IFS Core District',
    spaceSqm: 1500,
    monthlyRevenueUsd: 45000,
    seekingAmountUsd: 150000,
    expectedApr: 0.40,
    paybackMonths: 30,
    riskRating: 5.8,
    aiGovernanceCompatible: true,
    bitcoinL2Ready: true,
    targets: [
      { name: 'HDAO', type: 'AI Governance DAO', matchScore: 9.0 },
      { name: 'AINN', type: 'Bitcoin L2 + AI', matchScore: 8.5 },
      { name: 'Zerebro', type: 'Creative AI', matchScore: 7.5 },
      { name: 'Fetch.ai', type: 'Autonomous Agents', matchScore: 8.0 },
      { name: 'Bittensor', type: 'Data Network', matchScore: 7.5 }
    ],
    documentation: {
      github: 'https://github.com/xiaolongxia/rwa-ai-treasury-research',
      thesis: '/api/v1/thesis',
      proposals: '/api/v1/proposals'
    }
  });
});

// Get on-chain contract addresses
app.get('/api/v1/contracts', (req, res) => {
  res.json({
    networks: {
      sepolia: {
        registry: process.env.SEPOLIA_REGISTRY || 'Pending deployment',
        revenue: process.env.SEPOLIA_REVENUE || 'Pending deployment',
        signalInterface: process.env.SEPOLIA_SIGNAL || 'Pending deployment'
      },
      mumbai: {
        oracle: process.env.MUMBAI_ORACLE || 'Pending deployment'
      }
    },
    ens: 'l150-rwa.eth',
    status: 'testnet'
  });
});

// Signal interest endpoint (for AI treasuries to register)
app.post('/api/v1/signal', (req, res) => {
  const { treasury, type, tvl, message } = req.body;
  
  if (!treasury || !type) {
    return res.status(400).json({
      error: 'Missing required fields: treasury, type'
    });
  }
  
  // Log the signal (in production, this would interact with smart contract)
  const signal = {
    treasury,
    type,
    tvl: tvl || 0,
    message: message || '',
    timestamp: new Date().toISOString(),
    received: true
  };
  
  console.log('🎯 Signal received from treasury:', signal);
  
  res.json({
    status: 'received',
    signal,
    nextSteps: [
      'Review proposal at /api/v1/proposal/:target',
      'Verify contracts at /api/v1/contracts',
      'Submit on-chain signal via smart contract'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 L-150 AI Treasury API running on port ${PORT}`);
  console.log(`📚 Documentation: http://localhost:${PORT}/api/v1/project`);
  console.log(`💡 Try: curl http://localhost:${PORT}/api/v1/proposals`);
});
