const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['new_user', 'new_report', 'like', 'comment', 'status_change'],
      required: true,
    },
    title:        { type: String, required: true },
    message:      { type: String, required: true },
    read:         { type: Boolean, default: false },
    reportId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },
    fromUser:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   default: null },
    fromUserName: { type: String, default: '' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
