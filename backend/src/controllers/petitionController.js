const Petition = require('../models/Petition');

// ─── CREAR PETICIÓN ───────────────────────────────────────────────────────────
const createPetition = async (req, res, next) => {
  try {
    const { title, recipientName, recipientTitle, city, body, requests, goal } = req.body;

    const petition = await Petition.create({
      title,
      recipientName: recipientName || 'Señor Alcalde Municipal',
      recipientTitle: recipientTitle || 'Alcalde Municipal',
      city: city || 'Pasto',
      body,
      requests: requests || [],
      goal: goal || 100,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, message: 'Petición creada', petition });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENER TODAS LAS PETICIONES ─────────────────────────────────────────────
const getPetitions = async (req, res, next) => {
  try {
    const petitions = await Petition.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.status(200).json({ success: true, petitions });
  } catch (error) {
    next(error);
  }
};

// ─── OBTENER UNA PETICIÓN ─────────────────────────────────────────────────────
const getPetitionById = async (req, res, next) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('signatures.user', 'name city');

    if (!petition || !petition.isActive) {
      return res.status(404).json({ success: false, message: 'Petición no encontrada' });
    }

    res.status(200).json({ success: true, petition });
  } catch (error) {
    next(error);
  }
};

// ─── ACTUALIZAR PETICIÓN ──────────────────────────────────────────────────────
const updatePetition = async (req, res, next) => {
  try {
    const { title, recipientName, recipientTitle, city, body, requests, goal, isOpen } = req.body;

    const petition = await Petition.findByIdAndUpdate(
      req.params.id,
      { title, recipientName, recipientTitle, city, body, requests, goal, isOpen },
      { new: true, runValidators: true }
    );

    if (!petition) {
      return res.status(404).json({ success: false, message: 'Petición no encontrada' });
    }

    res.status(200).json({ success: true, message: 'Petición actualizada', petition });
  } catch (error) {
    next(error);
  }
};

// ─── ELIMINAR PETICIÓN ────────────────────────────────────────────────────────
const deletePetition = async (req, res, next) => {
  try {
    await Petition.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Petición eliminada' });
  } catch (error) {
    next(error);
  }
};

// ─── FIRMAR PETICIÓN ──────────────────────────────────────────────────────────
const signPetition = async (req, res, next) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition || !petition.isActive) {
      return res.status(404).json({ success: false, message: 'Petición no encontrada' });
    }

    if (!petition.isOpen) {
      return res.status(400).json({ success: false, message: 'Esta petición ya no acepta firmas' });
    }

    const alreadySigned = petition.signatures.some(
      s => s.user?.toString() === req.user.id
    );

    if (alreadySigned) {
      return res.status(400).json({ success: false, message: 'Ya firmaste esta petición' });
    }

    petition.signatures.push({
      user:           req.user.id,
      name:           req.user.name,
      cedula:         req.body.cedula || '',
      city:           req.user.city || '',
      signatureImage: req.body.signatureImage || '',
    });
    petition.signaturesCount = petition.signatures.length;
    await petition.save();

    res.status(200).json({
      success: true,
      message: '¡Firma registrada exitosamente!',
      signaturesCount: petition.signaturesCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── QUITAR FIRMA ─────────────────────────────────────────────────────────────
const unsignPetition = async (req, res, next) => {
  try {
    const petition = await Petition.findById(req.params.id);

    if (!petition) {
      return res.status(404).json({ success: false, message: 'Petición no encontrada' });
    }

    petition.signatures = petition.signatures.filter(
      s => s.user?.toString() !== req.user.id
    );
    petition.signaturesCount = petition.signatures.length;
    await petition.save();

    res.status(200).json({
      success: true,
      message: 'Firma retirada',
      signaturesCount: petition.signaturesCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPetition,
  getPetitions,
  getPetitionById,
  updatePetition,
  deletePetition,
  signPetition,
  unsignPetition,
};
