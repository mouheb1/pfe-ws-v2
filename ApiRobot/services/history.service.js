const ResponseStatus = require("../enum/ResponseStatus");
const MsgReponseStatus = require("../models/Response/MessageResponse");
const Robot = require("../models/entity/Robot");
const History = require('../models/entity/History');
const { ObjectId } = require("mongodb");
const moment = require("moment");

let createdHistories = {};

const getAllHistory = async (filter={}) => {
  const pipeline = [];

  // Date filter
  if (filter.date) {
    const startDate = moment(filter.date).startOf('day').toDate();
    const endDate = moment(filter.date).endOf('day').toDate();

    pipeline.push({
      $match: {
        startExecutionAt: { $gte: startDate },
        endExecutionAt: { $lte: endDate },
      },
    });
  }

  // Lookup and unwind robot and user details
  pipeline.push(
    {
      $lookup: {
        from: 'robots',
        localField: 'robotId',
        foreignField: '_id',
        as: 'robot'
      }
    },
    {
      $unwind: {
        path: '$robot',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        "timestamp": 1,
        "palatizedPieces": 1,
        "startExecutionAt": 1,
        "endExecutionAt": 1,
        "robot": {
          "_id": 1,
          "reference": 1,
          "ip_robot": 1,
          "totalPieces": 1
        },
        "user": {
          "_id": 1,
          "nom": 1,
          "prenom": 1
        }
      }
    }
  );

  // Search filter
  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i'); // Case-insensitive regex search
    pipeline.push({
      $match: {
        $or: [
          { 'robot.reference': searchRegex },
          { 'user.email': searchRegex },
          { 'user.nom': searchRegex },
          { 'user.prenom': searchRegex }
        ]
      }
    });
  }

  return await History.aggregate(pipeline);
};


const addHistory = async (dataRobot) => {
  const existingRobot = await Robot.findOne({ reference: dataRobot.reference });
  if (!existingRobot) {
    return MsgReponseStatus.builder()
      .setTitle("Error Message")
      .setDatestamp(new Date())
      .setStatus(ResponseStatus.ERROR)
      .setMessage("cannot find a robot")
      .build();
  }

  const robotId = existingRobot._id.toString();
  let history;

  if (createdHistories[robotId]) {
    // Update the existing history if it was created in this session
    const historySource = await History.findOne({ _id: createdHistories[robotId] });

    const palatizedPieces = historySource.palatizedPieces + 1;
    const completedPallets = Math.floor(palatizedPieces / 100);

    if (palatizedPieces > historySource.totalPieces) {
      return MsgReponseStatus.builder()
        .setTitle("Error Message")
        .setDatestamp(new Date())
        .setStatus(ResponseStatus.ERROR)
        .setMessage("all pieces are palatized")
        .build();
    }

    history = await History.findByIdAndUpdate(historySource._id, {
      palatizedPieces,
      completedPallets,
      totalExecutionDuration: palatizedPieces * 10, // each iteration takes 10 seconds
      palatizeExecutionDuration: completedPallets * 10 * 100, // each pallet has 100 pieces and each piece takes 10 sec
      userId: existingRobot.userId,
      endExecutionAt: new Date()
    }, { new: true });

  } else {
    // Create a new history record
    history = new History({
      _id: new ObjectId(),
      robotId: existingRobot._id,
      palatizedPieces: 1,
      totalPieces: existingRobot.totalPieces,
      userId: existingRobot.userId,
      startExecutionAt: new Date(),
      endExecutionAt: new Date()
    });
    await history.save();

    // Store the history ID in the in-memory object
    createdHistories[robotId] = history._id;
  }

  return MsgReponseStatus.builder()
    .setTitle("Success Message")
    .setDatestamp(new Date())
    .setStatus(ResponseStatus.SUCCESSFUL)
    .setMessage("successfully created history")
    .build();
};

deleteManyHistory = async (robotId) => {
  result = await History.deleteMany({ robotId: robotId });
  if (result.deletedCount > 0) {
    return MsgReponseStatus.builder()
      .setTitle("Success Message")
      .setDatestamp(new Date())
      .setStatus(ResponseStatus.ERROR)
      .setMessage("successfully deleted history by robotId")
      .build();
  }
  return MsgReponseStatus.builder()
    .setTitle("Error Message")
    .setDatestamp(new Date())
    .setStatus(ResponseStatus.SUCCESSFUL)
    .setMessage("cannot delete Many History")
    .build();
};


module.exports = { historyService: { insert: addHistory, selectAll: getAllHistory, deleteMany: deleteManyHistory } };