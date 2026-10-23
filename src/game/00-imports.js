import * as THREE from 'three';
import { createPremiumPortraits } from './assets/art/premium-models.js';

import { bindHeroMotion, animateHeroMotion } from './assets/data/hero-animation.js';
import { prepareOriginalAdventurer, equipOriginalAdventurer } from './assets/art/original-adventurers.js';
import { createKayKitMotion } from './assets/data/kaykit-motion.js';
import { applyHeroV4, heroV4Clips, gripV4Weapon, prepareV4Equipment, equipV4Hero } from './assets/data/hero-models-v4.js';
import { addHeroEyes } from './assets/data/hero-eyes.js';
import { relaxArms, showcaseClip } from './assets/data/hero-arms.js';
import { installHeroesV6, finishHeroesV6, applyHeroV6Models, HERO_V6, HEROES_V6 } from './assets/data/heroes-v6.js';
import { createHeroSupers } from './assets/data/hero-supers-v6.js';
import { createHeroFX } from './assets/data/hero-fx-v6.js';
import { equipmentIcon, caseIcon } from './assets/art/premium-icons.js';
import { COLLECTION_ITEMS, COLLECTION_CHANCE, COLLECTION_GUARANTEE, collectionIcon, rollCollectionItem, recordCollectionItem, migrateCollection, regionBossCase } from './assets/data/loot-collection.js';
import { PRESTIGE_LEVEL, prestigeCount, migratePrestige, prestigeBlock, prestigePlan, applyPrestige, statMilestone } from './assets/data/prestige.js';
import { PET_DEFS, PET_MAX_LEVEL, migratePets, equippedPet, petProgress, petBonuses, petAttackSpec, choosePet, grantPetXp, petCombatAllowed, findPetTarget } from './assets/data/companions.js';
import { createCompanion } from './assets/art/pet-companions.js';
import { damageMotion } from './assets/art/combat-feedback.js';
import { rigEnemyModel, createEnemyMotion } from './assets/data/enemy-motion.js';
import { createWorldArt, REGION_ART, POI_MODEL, poiRotation, poiLayout } from './assets/art/world-art.js';
import { TEST_PROFILE_TAG, isTestMode, isTestProfile, profileSaveKey, prepareTestProfile, testModeUrl } from './assets/data/test-mode.js';
// Icons: game-icons.net (CC BY 3.0) by caro-asercion, delapouite, lorc, sbed, skoll, various-artists, willdabeast — see Settings › Credits
