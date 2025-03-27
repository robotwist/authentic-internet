import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import DialogBox from '../DialogBox';
import QuestLogContext from '../../context/QuestLogContext';
import { NPC_TYPES } from '../../components/Constants';
import './NPCInteraction.css';

/**
 * Component for handling NPC interactions
 * Displays dialog, quest information, and handles dialog choices
 */
const NPCInteraction = ({ 
  npc,
  onClose,
  onQuestAccept,
  onQuestComplete
}) => {
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0);
  const [dialogOptions, setDialogOptions] = useState([]);
  const [dialogHistory, setDialogHistory] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const { user } = useContext(AuthContext);
  const { addQuest, completeQuest, quests } = useContext(QuestLogContext);
  
  // Initialize dialog based on NPC type and quest status
  useEffect(() => {
    if (!npc) return;
    
    // Reset state when NPC changes
    setCurrentDialogIndex(0);
    setDialogOptions([]);
    setDialogHistory([]);
    setIsComplete(false);
    
    // Add initial greeting
    const greeting = npc.greeting || `Greetings, traveler! I am ${npc.name}.`;
    setDialogHistory([{
      speaker: npc.name,
      text: greeting
    }]);
    
    // Check if this NPC has an active quest for the player
    const activeQuest = quests.find(q => 
      q.assignedBy === npc.id && !q.completed
    );
    
    // Set initial dialog options based on NPC type and quest status
    const initialOptions = [];
    
    if (activeQuest) {
      initialOptions.push({
        text: "About my quest...",
        action: () => handleQuestDiscussion(activeQuest)
      });
    } else if (npc.availableQuests && npc.availableQuests.length > 0) {
      initialOptions.push({
        text: "Do you need any help?",
        action: () => handleQuestOffer(npc.availableQuests[0])
      });
    }
    
    // Add NPC type-specific dialog options
    switch(npc.type) {
      case NPC_TYPES.MERCHANT:
        initialOptions.push({
          text: "Show me your wares",
          action: () => handleMerchantInteraction()
        });
        break;
      case NPC_TYPES.SCHOLAR:
      case NPC_TYPES.POET:
      case NPC_TYPES.SAGE:
      case NPC_TYPES.PHILOSOPHER:
        initialOptions.push({
          text: "I seek knowledge",
          action: () => handleScholarInteraction()
        });
        break;
      case NPC_TYPES.CRAFTSMAN:
        initialOptions.push({
          text: "Can you craft something for me?",
          action: () => handleCraftsmanInteraction()
        });
        break;
      case NPC_TYPES.GUIDE:
      case NPC_TYPES.WEATHERMAN:
        initialOptions.push({
          text: "Tell me about this place",
          action: () => handleGuideInteraction()
        });
        break;
      case NPC_TYPES.ARTIST:
      case NPC_TYPES.MICHELANGELO:
        initialOptions.push({
          text: "Tell me about your art",
          action: () => handleArtistInteraction()
        });
        break;
      case NPC_TYPES.SHAKESPEARE:
      case NPC_TYPES.OSCAR_WILDE:
      case NPC_TYPES.ALEXANDER_POPE:
      case NPC_TYPES.LORD_BYRON:
        initialOptions.push({
          text: "Recite something for me",
          action: () => handleLiteraryInteraction()
        });
        break;
      case NPC_TYPES.JOHN_MUIR:
        initialOptions.push({
          text: "Tell me about nature",
          action: () => handleNaturalistInteraction()
        });
        break;
      case NPC_TYPES.CODER:
      case NPC_TYPES.ADA_LOVELACE:
        initialOptions.push({
          text: "Tell me about programming",
          action: () => handleCoderInteraction()
        });
        break;
      case NPC_TYPES.ZEUS:
        initialOptions.push({
          text: "How's the weather, mighty Zeus?",
          action: () => handleZeusInteraction()
        });
        break;
      case NPC_TYPES.MYSTIC:
      case NPC_TYPES.JESUS:
      case NPC_TYPES.AUGUSTINE:
      case NPC_TYPES.SOCRATES:
        initialOptions.push({
          text: "Share your wisdom",
          action: () => handleMysticInteraction()
        });
        break;
      default:
        initialOptions.push({
          text: "Tell me about yourself",
          action: () => handleGenericInteraction()
        });
        break;
    }
    
    // Always add a farewell option
    initialOptions.push({
      text: "Goodbye",
      action: () => handleFarewell()
    });
    
    setDialogOptions(initialOptions);
    
  }, [npc, quests]);
  
  const handleQuestDiscussion = (quest) => {
    // Check if quest is complete
    const isQuestComplete = quest.objectives.every(obj => obj.completed);
    
    if (isQuestComplete) {
      // Quest completion dialog
      setDialogHistory([...dialogHistory, {
        speaker: user.username || "Player",
        text: "About my quest..."
      }, {
        speaker: npc.name,
        text: `You've completed all the objectives for ${quest.title}! Well done!`
      }]);
      
      // Add reward dialog
      if (quest.rewards) {
        setDialogHistory(prev => [...prev, {
          speaker: npc.name,
          text: `As promised, here's your reward: ${quest.rewards.map(r => r.description).join(', ')}`
        }]);
      }
      
      // Mark quest as complete
      if (onQuestComplete) {
        onQuestComplete(quest.id);
      }
      
      completeQuest(quest.id);
      
      // Set follow-up options
      setDialogOptions([
        {
          text: "Thank you!",
          action: () => handleFarewell()
        }
      ]);
    } else {
      // In-progress quest dialog
      setDialogHistory([...dialogHistory, {
        speaker: user.username || "Player",
        text: "About my quest..."
      }, {
        speaker: npc.name,
        text: `How's your progress on ${quest.title}? You still need to ${quest.objectives.filter(obj => !obj.completed).map(obj => obj.description).join(', ')}.`
      }]);
      
      // Set follow-up options
      setDialogOptions([
        {
          text: "I'm working on it",
          action: () => {
            setDialogHistory(prev => [...prev, {
              speaker: user.username || "Player",
              text: "I'm working on it."
            }, {
              speaker: npc.name,
              text: "Good luck then! Let me know when you're done."
            }]);
            
            setDialogOptions([
              {
                text: "Goodbye",
                action: () => handleFarewell()
              }
            ]);
          }
        },
        {
          text: "Can you remind me what to do?",
          action: () => {
            setDialogHistory(prev => [...prev, {
              speaker: user.username || "Player",
              text: "Can you remind me what to do?"
            }, {
              speaker: npc.name,
              text: quest.description
            }]);
            
            setDialogOptions([
              {
                text: "I'll get to it",
                action: () => handleFarewell()
              }
            ]);
          }
        }
      ]);
    }
  };
  
  const handleQuestOffer = (quest) => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Do you need any help?"
    }, {
      speaker: npc.name,
      text: `Indeed I do! ${quest.description}`
    }]);
    
    setDialogOptions([
      {
        text: "I'll help you",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "I'll help you."
          }, {
            speaker: npc.name,
            text: "Excellent! Return to me when you're done."
          }]);
          
          // Accept the quest
          if (onQuestAccept) {
            onQuestAccept(quest.id);
          }
          
          addQuest({
            ...quest,
            assignedBy: npc.id,
            dateAccepted: new Date()
          });
          
          setDialogOptions([
            {
              text: "I'll be on my way",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "Not interested",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "I'm not interested right now."
          }, {
            speaker: npc.name,
            text: "I understand. The offer stands if you change your mind."
          }]);
          
          setDialogOptions([
            {
              text: "Goodbye",
              action: () => handleFarewell()
            }
          ]);
        }
      }
    ]);
  };
  
  const handleMerchantInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Show me your wares."
    }, {
      speaker: npc.name,
      text: npc.merchantDialog || "Certainly! Take a look at my finest goods."
    }]);
    
    // Here we would normally show a shop interface
    // For now, just a placeholder dialog
    
    setDialogOptions([
      {
        text: "Maybe later",
        action: () => handleFarewell()
      }
    ]);
  };
  
  const handleScholarInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "I seek knowledge."
    }, {
      speaker: npc.name,
      text: npc.scholarDialog || npc.loreText || "The secrets of this world are many. What do you wish to learn?"
    }]);
    
    setDialogOptions([
      {
        text: "Tell me more",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "Tell me more."
          }, {
            speaker: npc.name,
            text: npc.additionalLore || "There are ancient powers at work here. The authentic internet is more than just a concept - it's a state of being."
          }]);
          
          setDialogOptions([
            {
              text: "Fascinating",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "Enough philosophy",
        action: () => handleFarewell()
      }
    ]);
  };
  
  const handleCraftsmanInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Can you craft something for me?"
    }, {
      speaker: npc.name,
      text: npc.craftsmanDialog || "I'd be happy to! But I'll need the right materials first."
    }]);
    
    // Here we would normally show a crafting interface
    // For now, just a placeholder dialog
    
    setDialogOptions([
      {
        text: "I'll gather materials",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleGuideInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Tell me about this place."
    }, {
      speaker: npc.name,
      text: npc.guideDialog || npc.aboutLocation || "This area is part of the Authentic Internet, a place where truth and sources matter."
    }]);
    
    setDialogOptions([
      {
        text: "What should I do here?",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "What should I do here?"
          }, {
            speaker: npc.name,
            text: npc.advice || "Explore, collect artifacts, and speak with the inhabitants. Each interaction may teach you something valuable."
          }]);
          
          setDialogOptions([
            {
              text: "Thank you",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "That's helpful",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleArtistInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Tell me about your art."
    }, {
      speaker: npc.name,
      text: npc.artistDialog || "Art is the divine expression of the human spirit, capturing eternal beauty in mortal form."
    }]);
    
    setDialogOptions([
      {
        text: "What inspires you?",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "What inspires you?"
          }, {
            speaker: npc.name,
            text: npc.inspiration || "I find inspiration in nature, in the human form, and in the divine mysteries that surround us all."
          }]);
          
          setDialogOptions([
            {
              text: "Your work is magnificent",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I must go",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleLiteraryInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Recite something for me."
    }, {
      speaker: npc.name,
      text: npc.quote || npc.literaryDialog || "Words are the vessels of thought, ships sailing on the sea of human consciousness."
    }]);
    
    setDialogOptions([
      {
        text: "That was beautiful",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "That was beautiful."
          }, {
            speaker: npc.name,
            text: npc.response || "Thank you. The power of language is in its ability to transcend time and space."
          }]);
          
          setDialogOptions([
            {
              text: "I shall remember your words",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I must depart",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleNaturalistInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Tell me about nature."
    }, {
      speaker: npc.name,
      text: npc.naturalistDialog || "In every walk with nature one receives far more than one seeks. The mountains are calling and I must go."
    }]);
    
    setDialogOptions([
      {
        text: "What should we preserve?",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "What should we preserve?"
          }, {
            speaker: npc.name,
            text: npc.conservationAdvice || "The wilderness. We must preserve these temples of nature for future generations."
          }]);
          
          setDialogOptions([
            {
              text: "I will respect the wild",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I must continue my journey",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleCoderInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Tell me about programming."
    }, {
      speaker: npc.name,
      text: npc.coderDialog || "Programming is the art of algorithm and logic. The analytical engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves."
    }]);
    
    setDialogOptions([
      {
        text: "What's your favorite algorithm?",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "What's your favorite algorithm?"
          }, {
            speaker: npc.name,
            text: npc.algorithmResponse || "I am particularly fond of recursive functions, which mirror the elegant self-similarity found in nature."
          }]);
          
          setDialogOptions([
            {
              text: "Fascinating perspective",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I shall compile this knowledge",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleZeusInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "How's the weather, mighty Zeus?"
    }, {
      speaker: npc.name,
      text: npc.zeusDialog || "The skies obey my command, mortal! Today I decree fair weather, but cross me and you may face my thunderbolts!"
    }]);
    
    setDialogOptions([
      {
        text: "I bow to your power",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "I bow to your power."
          }, {
            speaker: npc.name,
            text: npc.zeusResponse || "Wise choice! Perhaps you deserve a blessing from Olympus after all."
          }]);
          
          setDialogOptions([
            {
              text: "Thank you, Lord of the Sky",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I must attend to mortal matters",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleMysticInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Share your wisdom."
    }, {
      speaker: npc.name,
      text: npc.mysticDialog || "The path to wisdom begins with acknowledging how little we truly know."
    }]);
    
    setDialogOptions([
      {
        text: "What is the meaning of life?",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "What is the meaning of life?"
          }, {
            speaker: npc.name,
            text: npc.philosophicalAnswer || "The examined life is worth living. Find truth by questioning assumptions and seeking authentic understanding."
          }]);
          
          setDialogOptions([
            {
              text: "I will reflect on this",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I must continue my journey",
        action: () => handleFarewell()
      }
    ]);
  };

  const handleGenericInteraction = () => {
    setDialogHistory([...dialogHistory, {
      speaker: user.username || "Player",
      text: "Tell me about yourself."
    }, {
      speaker: npc.name,
      text: npc.aboutSelf || `I am ${npc.name}, a resident of this digital realm. How may I assist you on your journey?`
    }]);
    
    setDialogOptions([
      {
        text: "What do you do here?",
        action: () => {
          setDialogHistory(prev => [...prev, {
            speaker: user.username || "Player",
            text: "What do you do here?"
          }, {
            speaker: npc.name,
            text: npc.roleDescription || "I play my part in maintaining the balance of this world."
          }]);
          
          setDialogOptions([
            {
              text: "Interesting",
              action: () => handleFarewell()
            }
          ]);
        }
      },
      {
        text: "I should be going",
        action: () => handleFarewell()
      }
    ]);
  };
  
  const handleFarewell = () => {
    setDialogHistory(prev => [...prev, {
      speaker: user.username || "Player",
      text: "Goodbye."
    }, {
      speaker: npc.name,
      text: npc.farewellText || "Farewell! Stay authentic out there."
    }]);
    
    setIsComplete(true);
    
    // Close the dialog after a brief delay
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
  };
  
  // Generate dialog component
  return (
    <div className={`npc-interaction npc-type-${npc?.type?.toLowerCase()}`}>
      {npc && (
        <>
          <div className="npc-portrait">
            {npc.portrait || npc.avatar ? (
              <img src={npc.portrait || npc.avatar} alt={npc.name} />
            ) : (
              <div className="npc-avatar">{npc.name.charAt(0)}</div>
            )}
          </div>
          
          <DialogBox
            npcName={npc.name}
            dialogHistory={dialogHistory}
            dialogOptions={!isComplete ? dialogOptions : []}
            onOptionSelected={(option) => {
              if (option.action) {
                setDialogHistory(prev => [...prev, {
                  speaker: user.username || "Player",
                  text: option.text
                }]);
                option.action();
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default NPCInteraction; 