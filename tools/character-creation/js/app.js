(function() {

	function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	var CC = angular.module('CharacterCreation', []);

	CC.filter('translate', function($http) {
		var db = {
			skills: {},
			profession: {}
		};
		$http.get('resources/skills-fr.json')
			.success(function(data) {
				db.skills = data;
			})
		return function(input, type) {
			if(input) return db[type][input] || input;
			return input;
		};
	});

	CC.controller('AppCtrl', function($scope, $rootScope, $http) {

		$scope.defaultCharacter = {
			generalInfos: {
				playerName: ""
			},
			civilStatus: {
				name: "",
				race: {
					name: "",
					mods: {
						characteristics: {}
					},
					professions: []
				},
				gender: "",
				handedness: "",
				description: "",
				height: 0,
				weight: 0,
				age: 0,
				distinctivesFeatures: "",
				move: 0,
				profession: "",
				wealth: ""
			},
			characteristics: {
				strength: 10,
				constitution: 10,
				size: 10,
				intelligence: 10,
				power: 10,
				dexterity: 10,
				appearance: 10,
				effort: 0,
				stamina: 0,
				damageBonus: 0,
				idea: 0,
				luck: 0,
				agility: 0,
				charisma: 0
			},
			personality: {},
			profession: {},
			skills: {}
		};

		$scope.character = angular.copy($scope.defaultCharacter);

		$http.get('resources/skills.json')
			.success(function(data) {
				$scope.skills = data;
			});

		$scope.reset = function(phase) {
			$rootScope.$broadcast('reset' + (phase ? '-'+phase : ''));
		};

		$scope.phases = ['general-infos', 'civil-status', 'characteristics', 'personality-and-profession', 'skills', 'weapon-skills'];
		$scope.currentPhase = 0;
		$scope.isCurrentPhase = function(phase) {
			return $scope.phases.indexOf(phase) <= $scope.currentPhase;
		};

		$scope.invalidate = function(phase) {
			var i = $scope.phases.indexOf(phase);
			if($scope.currentPhase > i) {
				$scope.currentPhase = i;
				$scope.phases.forEach(function(p, j) {
					if(j > i) $scope.reset(p);
				});
			}
		}

		$scope.toggle = function(phase, toggle) {
			return toggle ? $scope.validate(phase) : $scope.invalidate(phase);
		}

		$scope.validate = function(phase) {
			var i = $scope.phases.indexOf(phase);
			if($scope.currentPhase == i ) $scope.currentPhase += 1;
			$scope.phases
				.forEach(function(p, j) {
					if(j >= $scope.currentPhase) $rootScope.$broadcast('check-'+p);
				});
		}

	});

	CC.controller('GeneralInfosCtrl', function($scope) {

		$scope.$watch('character.generalInfos.playerName', function(newVal) {
			$scope.toggle('general-infos', newVal);
		}, true);

	});

	CC.controller('CharacterInfosCtrl', function($scope) {

		$scope.$watch('character.civilStatus', function(civilStatus) {
			$scope.toggle(
				'civil-status',
				civilStatus.gender && civilStatus.name && civilStatus.race && civilStatus.handedness
			);
		}, true);

		$scope.$on('check-civil-status', function() {
			var civilStatus = $scope.character.civilStatus;
			$scope.toggle(
				'civil-status',
				civilStatus.gender && civilStatus.name && civilStatus.race && civilStatus.handedness
			);
		});

		$scope.races = [
			{ 
				name: "K'aak",
				mods: {
					characteristics: {
						maxSize: 12,
						move: 10
					}
				},
				professions: [
					{
						name: 'Agriculteur',
						skills: ['bargain', 'craft', 'listen', 'spot', 'brawl', 'first-aid', 'repair', 'track']
					},
					{
						name: 'Artisan',
						skills: ['appraise', 'art', 'bargain', 'craft', 'spot', 'research', 'status', 'fine-manipulation', 'repair']
					},
					{
						name: 'Chasseur',
						skills: ['climb', 'hide', 'listen', 'navigate', 'spot', 'stealth', 'track', 'weapon-spear', 'weapon-missile', 'weapon-bow']
					},
					{
						name: 'Chaman', 
						skills: ['art', 'insight', 'listen', 'persuade', 'craft', 'fast-talk', 'first-aid', 'hide', 'medicine', 'status']
					}
				]

			}
		];

		$scope.getSelectedRaceDescription = function() {
			var r = $scope.character.civilStatus.race.name;
			if(r) {
				return "partials/race-" + r.toLowerCase() + '.html';
			} else return 'partials/race-default.html';
		};

		$scope.$watch('character.civilStatus.race', function() {
			$scope.reset('characteristics');
		}, true);

	});


	CC.controller('characteristicsCtrl', function($scope) {

		$scope.$watch('pool', function(newVal) {
			$scope.toggle('characteristics', !newVal);
		}, true);

		$scope.$on('reset-characteristics', function() {
			$scope.pool = $scope.defaultPool;
			$scope.character.characteristics = angular.copy($scope.defaultCharacter.characteristics);
		});

		$scope.prevCharacteristics = {};
		$scope.costs = {
			strength: 1,
			constitution: 1,
			size: 1,
			intelligence: 3,
			power: 3,
			dexterity: 3,
			appearance: 1
		};
		$scope.defaultPool = 24;
		$scope.pool = $scope.defaultPool;
		$scope.maxPoints = 21;
		$scope.minPoints = 3;

		$scope.change = function(charac) {
			if(!angular.isNumber($scope.prevCharacteristics[charac])) {
				$scope.prevCharacteristics[charac] = parseInt($scope.character.characteristics[charac]);
			}
			$scope.pool += (parseInt($scope.prevCharacteristics[charac]) - parseInt($scope.character.characteristics[charac]))*$scope.costs[charac];
			$scope.prevCharacteristics[charac] = parseInt($scope.character.characteristics[charac]);
			$scope.reset('skills');
		};

		$scope.getMax = function(charac) {
			var mods = $scope.character.civilStatus.race.mods || {};
			return Math.min(
				parseInt($scope.character.characteristics[charac]) + Math.floor($scope.pool/$scope.costs[charac]), 
				$scope.maxPoints, 
				mods.characteristics['max'+capitalize(charac)] || Number.MAX_VALUE
			);
		};

		$scope.allowChange = function(charac) {
			return $scope.pool - $scope.costs[charac] >= 0;
		};

		$scope.updateRolls = function() {
			var c = $scope.character.characteristics;
			c.effort = 5 * c.strength;
			c.stamina = 5 * c.constitution;
			c.damageBonus = parseInt(c.strength) + parseInt(c.size);
			c.idea = 5 * c.intelligence;
			c.luck = 5 * c.power;
			c.agility = 5 * c.dexterity;
			c.charisma = 5 * c.appearance;
		};

			
		$scope.$watch('character.characteristics', function() {
			$scope.updateRolls();
		}, true);

	});

	CC.controller('PersonalityAndProfessionCtrl', function($scope) {

		$scope.$on('reset-personality-and-profession', function() {
			var character = $scope.character;
			character.profession = {};
			character.personality = {};
		});

		$scope.$watch('character', function(newVal) {
			var character = $scope.character;
			$scope.toggle('personality-and-profession', character.profession.name && character.personality.description);
		}, true);

		$scope.personalities = [
			{
				description: "Aucun problème ne peut résister à la force de vos muscles.",
				skills: ['brawl', 'climb', 'dodge', 'insight', 'jump', 'sense', 'stealth', 'swim', 'throw', 'combat', 'combat'],
			},
			{
				description: "La technique et l'entraînement sont les clés de votre succès.",
				skills: ['appraise', 'craft', 'disguise', 'dodge', 'fine-manipulation', 'first-aid', 'navigate', 'stealth', 'combat'],
			},
			{
				description: "Votre malice est capable de vous sortir de toutes les situations épineuses.",
				skills: ['appraise', 'bargain', 'disguise', 'insight', 'listen', 'research', 'sense', 'spot', 'stealth', 'combat'],
			},
			{
				description: "Votre charisme naturel vous permet de persuader votre entourage et d'amener les autres à effectuer le travail à votre place.",
				skills: ['appraise', 'bargain', 'command', 'etiquette', 'fast-talk', 'insight', 'perform', 'persuade', 'sense', 'status', 'combat'],
			}
		];
	});

	CC.controller('SkillsCtrl', function($scope, $parse) {

		$scope.$on('reset-skills', function() {
			$scope.reset();
		});

		$scope.prevSkills = {};
		$scope.combatSkill = [];
		$scope.groupedSkills = [];
		$scope.characterSkills = [];

		$scope.defaultPool = 250;
		$scope.pool = $scope.defaultPool;

		$scope.updateGroupedSkills = function() {
			var skills = $scope.characterSkills;
			$scope.groupedSkills = [];
			for(var i = 0, len = skills.length; i < len; i++) {
				if(i < len-1) {
					$scope.groupedSkills.push([skills[i], skills[i+1]])
					i++;
				} else {
					$scope.groupedSkills.push([skills[i]]);
				}
			}
		}

		$scope.getSkill = function(name) {
			var k, cat,
				i, skill;
			for(k in $scope.skills) {
				cat = $scope.skills[k];
				for(i = 0; i < cat.length; ++i) {
					skill = cat[i];
					if(skill.name === name) return skill;
				}
			}
			return null;
		};

		$scope.interpretBaseSkill = function(str) {
			var getter = $parse(str),
				context = $scope.character.characteristics;
			return getter(context);
		};

		$scope.getMax = function(skill) {
			return Math.min(
				parseInt($scope.character.skills[skill]) + $scope.pool, 
				75
			);
		};

		$scope.getMin = function(skillId) {

			var skill = $scope.getSkill(skillId),
				charPersoSkills = $scope.character.personality.skills,
				min = $scope.interpretBaseSkill(skill.base);

			if(skillId in charPersoSkills) min += 20;

			return min;
		};

		$scope.change = function(skill) {
			if(!angular.isNumber($scope.prevSkills[skill])) {
				$scope.prevSkills[skill] = parseInt($scope.character.skills[skill]);
			}
			$scope.pool += (parseInt($scope.prevSkills[skill]) - parseInt($scope.character.skills[skill]));
			$scope.prevSkills[skill] = parseInt($scope.character.skills[skill]);
		};

		$scope.reset = function() {

			var skills = $scope.skills,
				charProfSkills = $scope.character.profession.skills,
				charPersoSkills = $scope.character.personality.skills;

			$scope.characterSkills = []
				.concat($scope.character.personality.skills || [], $scope.character.profession.skills || [])
				.filter(function(value, i, arr) {
					return value !== 'combat' && i === arr.indexOf(value);
				});

			$scope.characterSkills
				.forEach(function(skillId) {
					if(skillId === 'combat') return;
					$scope.character.skills[skillId] = $scope.getMin(skillId);
				});

			$scope.updateGroupedSkills();

			$scope.pool = $scope.defaultPool;

		};

	});

	CC.controller('WeaponSkillsCtrl', function($scope) {

	});

}());