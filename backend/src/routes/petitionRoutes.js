const express = require('express');
const router = express.Router();
const {
  createPetition, getPetitions, getPetitionById,
  updatePetition, deletePetition, signPetition, unsignPetition,
} = require('../controllers/petitionController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/',     getPetitions);
router.get('/:id',  getPetitionById);

router.post('/',         protect, adminOnly, createPetition);
router.put('/:id',       protect, adminOnly, updatePetition);
router.delete('/:id',    protect, adminOnly, deletePetition);

router.post('/:id/sign',   protect, signPetition);
router.delete('/:id/sign', protect, unsignPetition);

module.exports = router;
