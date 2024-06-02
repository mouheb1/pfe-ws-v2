const History = require('../models/entity/History');
const Robot = require('../models/entity/Robot');
const { historyService } = require('../services/history.service');
 
exports.getAllHistory = async (req, res) => {
  try {
    let filter = {}

    if (req.query) {
      filter = {
        ...req.query
      }
    }
  
    const histories = await historyService.selectAll(filter);
    res.json(histories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update history by robotId

exports.updateHistory = async (req, res) => {
  try {
    const updatedHistory = await History.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedHistory) {
      return res.status(404).send('User not found');
    }
    res.send(updatedHistory);
  } catch (error) {
    console.error('Error:', error); // Log toute erreur
    res.status(400).send(error);
  }
};