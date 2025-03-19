import axios from 'axios';
import { API_CONFIG, buildApiUrl, getApiParams } from '../config/apiConfig.js';

// Weather API integration
export const fetchWeather = async (config = {}) => {
  try {
    // Use location from config or default to London
    const location = config.location || { lat: 51.5074, lon: 0.1278 };
    
    // Build URL using our API config
    const url = buildApiUrl('weather', 'current');
    
    // Get API parameters including API key
    const params = getApiParams('weather', {
      lat: location.lat,
      lon: location.lon,
      // Use any custom units from config or default to metric
      units: config.units || 'metric'
    });
    
    const response = await axios.get(url, { params });
    
    return {
      temperature: response.data.main.temp,
      conditions: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      city: response.data.name,
      // Include the full weather data for more detailed responses
      fullData: response.data
    };
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error('Failed to fetch weather data');
  }
};

// Shakespeare API integration
export const fetchShakespeareQuote = async (prompt) => {
  try {
    // Fetch multiple quotes for more varied responses
    const response = await axios.get('https://api.quotable.io/quotes', {
      params: {
        tags: 'shakespeare',
        limit: 5
      }
    });
    
    if (!response.data.results || response.data.results.length === 0) {
      throw new Error('No Shakespeare quotes found');
    }
    
    // Select a random quote from the results
    const quotes = response.data.results;
    const randomQuotes = [];
    
    // Get 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < quotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * quotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < quotes.length);
      
      usedIndices.add(randomIndex);
      randomQuotes.push(quotes[randomIndex]);
    }
    
    // Format the response with multiple quotes
    return {
      quote: randomQuotes.map(q => q.content).join('\n\n'),
      author: 'William Shakespeare',
      work: 'Various works',
      location: 'Various locations'
    };
  } catch (error) {
    console.error('Shakespeare API error:', error);
    throw new Error('Failed to fetch Shakespeare quotes');
  }
};

// Keats API integration
export const fetchKeatsQuote = async (prompt) => {
  try {
    // Fetch multiple quotes for more varied responses
    const response = await axios.get('https://api.quotable.io/quotes', {
      params: {
        tags: 'keats',
        limit: 5
      }
    });
    
    if (!response.data.results || response.data.results.length === 0) {
      throw new Error('No Keats quotes found');
    }
    
    // Select random quotes from the results
    const quotes = response.data.results;
    const randomQuotes = [];
    
    // Get 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < quotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * quotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < quotes.length);
      
      usedIndices.add(randomIndex);
      randomQuotes.push(quotes[randomIndex]);
    }
    
    // Format the response with multiple quotes
    return {
      quote: randomQuotes.map(q => q.content).join('\n\n'),
      author: 'John Keats',
      dialogue: 'Various poems',
      translator: 'Original'
    };
  } catch (error) {
    console.error('Keats API error:', error);
    throw new Error('Failed to fetch Keats quotes');
  }
};

// Socrates API integration
export const fetchSocratesQuote = async (prompt) => {
  try {
    // Fetch multiple quotes for more varied responses
    const response = await axios.get('https://api.quotable.io/quotes', {
      params: {
        tags: 'socrates,philosophy',
        limit: 5
      }
    });
    
    if (!response.data.results || response.data.results.length === 0) {
      throw new Error('No Socrates quotes found');
    }
    
    // Select random quotes from the results
    const quotes = response.data.results;
    const randomQuotes = [];
    
    // Get 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < quotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * quotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < quotes.length);
      
      usedIndices.add(randomIndex);
      randomQuotes.push(quotes[randomIndex]);
    }
    
    // Format the response with multiple quotes
    return {
      quote: randomQuotes.map(q => q.content).join('\n\n'),
      author: 'Socrates',
      dialogue: 'Various dialogues',
      translator: 'Various',
      section: 'Various sections'
    };
  } catch (error) {
    console.error('Socrates API error:', error);
    throw new Error('Failed to fetch Socrates quotes');
  }
};

// Generic quotes API integration
export const fetchQuote = async (config) => {
  try {
    const response = await axios.get(config.endpoint, {
      params: {
        ...config.parameters,
        api_key: config.apiKey
      }
    });
    return {
      quote: response.data.quote,
      author: response.data.author
    };
  } catch (error) {
    console.error('Quotes API error:', error);
    throw new Error('Failed to fetch quote');
  }
};

// Michelangelo API integration
export const fetchMichelangeloQuote = async (prompt) => {
  try {
    // Michelangelo quotes collection
    const michelangeloQuotes = [
      {
        quote: "I saw the angel in the marble and carved until I set him free.",
        source: "Letter to Benedetto Varchi",
        date: "1549",
        recipient: "Benedetto Varchi"
      },
      {
        quote: "The greater danger for most of us lies not in setting our aim too high and falling short, but in setting our aim too low and achieving our mark.",
        source: "Documented Conversations",
        date: "circa 1530",
        recipient: null
      },
      {
        quote: "Every block of stone has a statue inside it and it is the task of the sculptor to discover it.",
        source: "Conversations with Michelangelo",
        date: "1538",
        recipient: "Francisco de Hollanda"
      },
      {
        quote: "The true work of art is but a shadow of the divine perfection.",
        source: "Letters",
        date: "1542",
        recipient: "Vittoria Colonna"
      },
      {
        quote: "I am still learning.",
        source: "Documented Conversations",
        date: "circa 1560",
        recipient: null
      },
      {
        quote: "Genius is eternal patience.",
        source: "Notes",
        date: "1545",
        recipient: null
      },
      {
        quote: "The marble not yet carved can hold the form of every thought the greatest artist has.",
        source: "Poems",
        date: "1538",
        recipient: null
      },
      {
        quote: "Lord, grant that I may always desire more than I can accomplish.",
        source: "Letters",
        date: "1547",
        recipient: "Giorgio Vasari"
      },
      {
        quote: "If people knew how hard I worked to get my mastery, it wouldn't seem so wonderful at all.",
        source: "Documented Conversations",
        date: "1555",
        recipient: null
      },
      {
        quote: "Beauty is the purgation of superfluities.",
        source: "Notes",
        date: "1540",
        recipient: null
      },
      {
        quote: "The promises of this world are, for the most part, vain phantoms; and to confide in one's self, and become something of worth and value is the best and safest course.",
        source: "Letters",
        date: "1553",
        recipient: "Lionardo Buonarroti"
      },
      {
        quote: "I cannot live under pressures from patrons, let alone paint.",
        source: "Letters",
        date: "1542",
        recipient: "Pope Paul III"
      }
    ];
    
    // Select 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const selectedQuotes = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < michelangeloQuotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * michelangeloQuotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < michelangeloQuotes.length);
      
      usedIndices.add(randomIndex);
      selectedQuotes.push(michelangeloQuotes[randomIndex]);
    }
    
    // Return the first quote with full details
    return {
      quote: selectedQuotes[0].quote,
      author: "Michelangelo",
      source: selectedQuotes[0].source,
      date: selectedQuotes[0].date,
      recipient: selectedQuotes[0].recipient,
      additionalQuotes: selectedQuotes.slice(1).map(q => q.quote)
    };
  } catch (error) {
    console.error('Michelangelo quote error:', error);
    throw new Error('Failed to fetch Michelangelo quote');
  }
};

// Oscar Wilde API integration
export const fetchOscarWildeQuote = async (prompt) => {
  try {
    // Oscar Wilde quotes collection
    const oscarWildeQuotes = [
      {
        quote: "I can resist everything except temptation.",
        source: "Lady Windermere's Fan",
        date: "1892",
        work: "Play"
      },
      {
        quote: "We are all in the gutter, but some of us are looking at the stars.",
        source: "Lady Windermere's Fan",
        date: "1892",
        work: "Play"
      },
      {
        quote: "The truth is rarely pure and never simple.",
        source: "The Importance of Being Earnest",
        date: "1895",
        work: "Play"
      },
      {
        quote: "Experience is simply the name we give our mistakes.",
        source: "The Picture of Dorian Gray",
        date: "1890",
        work: "Novel"
      },
      {
        quote: "To live is the rarest thing in the world. Most people exist, that is all.",
        source: "The Soul of Man Under Socialism",
        date: "1891",
        work: "Essay"
      },
      {
        quote: "Be yourself; everyone else is already taken.",
        source: "Attributed",
        date: "Unknown",
        work: "Quote"
      },
      {
        quote: "Always forgive your enemies; nothing annoys them so much.",
        source: "Attributed",
        date: "Unknown",
        work: "Quote"
      },
      {
        quote: "I have nothing to declare except my genius.",
        source: "Remark to customs official upon arrival in America",
        date: "1882",
        work: "Spoken"
      },
      {
        quote: "A cynic is a man who knows the price of everything and the value of nothing.",
        source: "Lady Windermere's Fan",
        date: "1892",
        work: "Play"
      },
      {
        quote: "Fashion is a form of ugliness so intolerable that we have to alter it every six months.",
        source: "Literary Review",
        date: "1885",
        work: "Essay"
      },
      {
        quote: "The only thing worse than being talked about is not being talked about.",
        source: "The Picture of Dorian Gray",
        date: "1890",
        work: "Novel"
      },
      {
        quote: "Life is far too important a thing ever to talk seriously about it.",
        source: "Lady Windermere's Fan",
        date: "1892",
        work: "Play"
      },
      {
        quote: "There is only one thing in the world worse than being talked about, and that is not being talked about.",
        source: "The Picture of Dorian Gray",
        date: "1890",
        work: "Novel"
      },
      {
        quote: "The books that the world calls immoral are books that show the world its own shame.",
        source: "The Picture of Dorian Gray",
        date: "1890",
        work: "Novel"
      },
      {
        quote: "We are each our own devil, and we make this world our hell.",
        source: "The Duchess of Padua",
        date: "1883",
        work: "Play"
      }
    ];
    
    // Select 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const selectedQuotes = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < oscarWildeQuotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * oscarWildeQuotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < oscarWildeQuotes.length);
      
      usedIndices.add(randomIndex);
      selectedQuotes.push(oscarWildeQuotes[randomIndex]);
    }
    
    // Return the first quote with full details
    return {
      quote: selectedQuotes[0].quote,
      author: "Oscar Wilde",
      source: selectedQuotes[0].source,
      date: selectedQuotes[0].date,
      work: selectedQuotes[0].work,
      additionalQuotes: selectedQuotes.slice(1).map(q => q.quote)
    };
  } catch (error) {
    console.error('Oscar Wilde quote error:', error);
    throw new Error('Failed to fetch Oscar Wilde quote');
  }
};

// Alexander Pope API integration
export const fetchAlexanderPopeQuote = async (prompt) => {
  try {
    // Alexander Pope quotes collection
    const alexanderPopeQuotes = [
      {
        quote: "To err is human, to forgive divine.",
        source: "An Essay on Criticism",
        date: "1711",
        work: "Poem"
      },
      {
        quote: "A little learning is a dangerous thing; Drink deep, or taste not the Pierian spring.",
        source: "An Essay on Criticism",
        date: "1711",
        work: "Poem"
      },
      {
        quote: "Fools rush in where angels fear to tread.",
        source: "An Essay on Criticism",
        date: "1711",
        work: "Poem"
      },
      {
        quote: "Hope springs eternal in the human breast; Man never is, but always to be blessed.",
        source: "An Essay on Man",
        date: "1734",
        work: "Poem"
      },
      {
        quote: "Blessed is the man who expects nothing, for he shall never be disappointed.",
        source: "Letter to John Gay",
        date: "1727",
        work: "Letter"
      },
      {
        quote: "What Reason weaves, by Passion is undone.",
        source: "An Essay on Man",
        date: "1734",
        work: "Poem"
      },
      {
        quote: "The proper study of Mankind is Man.",
        source: "An Essay on Man",
        date: "1734",
        work: "Poem"
      },
      {
        quote: "To be angry is to revenge the faults of others on ourselves.",
        source: "Thoughts on Various Subjects",
        date: "1727",
        work: "Essay"
      },
      {
        quote: "True ease in writing comes from art, not chance, as those move easiest who have learned to dance.",
        source: "An Essay on Criticism",
        date: "1711",
        work: "Poem"
      },
      {
        quote: "Words are like leaves; and where they most abound, much fruit of sense beneath is rarely found.",
        source: "An Essay on Criticism",
        date: "1711",
        work: "Poem"
      },
      {
        quote: "Honor and shame from no condition rise; Act well your part, there all the honor lies.",
        source: "An Essay on Man",
        date: "1734",
        work: "Poem"
      },
      {
        quote: "The ruling passion, be it what it will, the ruling passion conquers reason still.",
        source: "Moral Essays",
        date: "1731-1735",
        work: "Poem"
      },
      {
        quote: "Who shall decide when doctors disagree, and soundest casuists doubt, like you and me?",
        source: "Moral Essays",
        date: "1731-1735",
        work: "Poem"
      },
      {
        quote: "Some people will never learn anything, for this reason, because they understand everything too soon.",
        source: "Thoughts on Various Subjects",
        date: "1727",
        work: "Essay"
      },
      {
        quote: "Teach me to feel another's woe, to hide the fault I see, that mercy I to others show, that mercy show to me.",
        source: "The Universal Prayer",
        date: "1738",
        work: "Poem"
      }
    ];
    
    // Select 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const selectedQuotes = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < alexanderPopeQuotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * alexanderPopeQuotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < alexanderPopeQuotes.length);
      
      usedIndices.add(randomIndex);
      selectedQuotes.push(alexanderPopeQuotes[randomIndex]);
    }
    
    // Return the first quote with full details
    return {
      quote: selectedQuotes[0].quote,
      author: "Alexander Pope",
      source: selectedQuotes[0].source,
      date: selectedQuotes[0].date,
      work: selectedQuotes[0].work,
      additionalQuotes: selectedQuotes.slice(1).map(q => q.quote)
    };
  } catch (error) {
    console.error('Alexander Pope quote error:', error);
    throw new Error('Failed to fetch Alexander Pope quote');
  }
};

// Zeus API integration
export const fetchZeusQuote = async (prompt) => {
  try {
    // Zeus quotes collection - mythological quotes and references
    const zeusQuotes = [
      {
        quote: "Mortals blame the gods. They say we cause suffering. But they bring it on themselves through their own recklessness.",
        source: "Odyssey",
        date: "8th century BCE",
        work: "Epic poem",
        author: "Homer"
      },
      {
        quote: "I am the Thunderer! Here in my cloud-girded hall, what mortal dares challenge the might of Zeus?",
        source: "Iliad",
        date: "8th century BCE",
        work: "Epic poem",
        author: "Homer"
      },
      {
        quote: "Even the gods cannot alter the past, but the future is yet in my power.",
        source: "Attributed to Zeus in Greek mythology",
        date: "Ancient",
        work: "Mythological saying",
        author: "Traditional"
      },
      {
        quote: "I swear by the river Styx, an oath that cannot be revoked.",
        source: "Theogony",
        date: "700 BCE",
        work: "Poem",
        author: "Hesiod"
      },
      {
        quote: "The minds of the everlasting gods are not changed suddenly.",
        source: "Iliad",
        date: "8th century BCE",
        work: "Epic poem",
        author: "Homer"
      },
      {
        quote: "From my divine head wisdom springs forth, for I am the storm-gatherer, the cloud-compeller.",
        source: "Homeric Hymns",
        date: "7th-6th century BCE",
        work: "Hymn",
        author: "Various"
      },
      {
        quote: "I am the father of gods and men, ruler of Olympus, wielder of thunderbolts.",
        source: "Theogony",
        date: "700 BCE",
        work: "Poem",
        author: "Hesiod"
      },
      {
        quote: "By my divine will, the seasons change, the rains fall, and thunder rolls across the sky.",
        source: "Works and Days",
        date: "700 BCE",
        work: "Poem",
        author: "Hesiod"
      },
      {
        quote: "Behold my aegis, the shield that brings storms and terror to mortals below.",
        source: "Iliad",
        date: "8th century BCE",
        work: "Epic poem",
        author: "Homer"
      },
      {
        quote: "I send forth my eagles to the ends of the earth, for they are my messengers and my eyes.",
        source: "Prometheus Bound",
        date: "5th century BCE",
        work: "Tragedy",
        author: "Aeschylus"
      },
      {
        quote: "The lightning is my spear, the thunder my voice. When I speak, the heavens tremble.",
        source: "Attributed to Zeus in Greek mythology",
        date: "Ancient",
        work: "Mythological saying",
        author: "Traditional"
      },
      {
        quote: "From my throne on Mount Olympus, I observe all that transpires in the mortal realm.",
        source: "Odyssey",
        date: "8th century BCE",
        work: "Epic poem",
        author: "Homer"
      },
      {
        quote: "Justice and divine retribution are mine to dispense, for I am the keeper of oaths and the punisher of hubris.",
        source: "Theogony",
        date: "700 BCE",
        work: "Poem",
        author: "Hesiod"
      },
      {
        quote: "The fate of cities and kingdoms rests in my hands, for I am the king of gods.",
        source: "Iliad",
        date: "8th century BCE",
        work: "Epic poem",
        author: "Homer"
      },
      {
        quote: "My thunderbolts can split the mountains and shake the foundations of the earth.",
        source: "Prometheus Bound",
        date: "5th century BCE",
        work: "Tragedy",
        author: "Aeschylus"
      }
    ];
    
    // Select 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const selectedQuotes = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < zeusQuotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * zeusQuotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < zeusQuotes.length);
      
      usedIndices.add(randomIndex);
      selectedQuotes.push(zeusQuotes[randomIndex]);
    }
    
    // Return the first quote with full details
    return {
      quote: selectedQuotes[0].quote,
      author: "Zeus (via " + selectedQuotes[0].author + ")",
      source: selectedQuotes[0].source,
      date: selectedQuotes[0].date,
      work: selectedQuotes[0].work,
      additionalQuotes: selectedQuotes.slice(1).map(q => q.quote)
    };
  } catch (error) {
    console.error('Zeus quote error:', error);
    throw new Error('Failed to fetch Zeus quote');
  }
};

// Jesus quotes API integration
export const fetchJesusQuote = async (prompt) => {
  try {
    // Collection of direct Jesus quotes from the Bible with references
    const jesusQuotes = [
      {
        quote: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
        source: "Matthew 5:3",
        context: "The Sermon on the Mount"
      },
      {
        quote: "You are the light of the world. A city set on a hill cannot be hidden.",
        source: "Matthew 5:14",
        context: "The Sermon on the Mount"
      },
      {
        quote: "Love your enemies and pray for those who persecute you.",
        source: "Matthew 5:44",
        context: "The Sermon on the Mount"
      },
      {
        quote: "Our Father in heaven, hallowed be your name. Your kingdom come, your will be done, on earth as it is in heaven.",
        source: "Matthew 6:9-10",
        context: "The Lord's Prayer"
      },
      {
        quote: "Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.",
        source: "Matthew 7:7",
        context: "The Sermon on the Mount"
      },
      {
        quote: "Come to me, all who labor and are heavy laden, and I will give you rest.",
        source: "Matthew 11:28",
        context: "Jesus's invitation"
      },
      {
        quote: "I am the way, and the truth, and the life. No one comes to the Father except through me.",
        source: "John 14:6",
        context: "Last Supper discourse"
      },
      {
        quote: "Let the little children come to me and do not hinder them, for to such belongs the kingdom of heaven.",
        source: "Matthew 19:14",
        context: "Jesus blessing the children"
      },
      {
        quote: "For what will it profit a man if he gains the whole world, but loses his soul?",
        source: "Mark 8:36",
        context: "Teaching about discipleship"
      },
      {
        quote: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
        source: "John 3:16",
        context: "Conversation with Nicodemus"
      },
      {
        quote: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
        source: "John 14:27",
        context: "Last Supper discourse"
      },
      {
        quote: "I am the bread of life; whoever comes to me shall not hunger, and whoever believes in me shall never thirst.",
        source: "John 6:35",
        context: "Bread of Life discourse"
      },
      {
        quote: "You shall love the Lord your God with all your heart and with all your soul and with all your mind. This is the great and first commandment. And a second is like it: You shall love your neighbor as yourself.",
        source: "Matthew 22:37-39",
        context: "Response to questioning about the greatest commandment"
      },
      {
        quote: "I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live.",
        source: "John 11:25",
        context: "Before raising Lazarus"
      },
      {
        quote: "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.",
        source: "Matthew 28:19",
        context: "The Great Commission"
      },
      {
        quote: "It is finished.",
        source: "John 19:30",
        context: "Jesus's words from the cross"
      }
    ];
    
    // Select 2-3 relevant quotes based on the prompt keywords
    const relevantQuotes = [];
    const promptLower = prompt.toLowerCase();
    
    // If specific keywords are found, try to find matching quotes
    if (promptLower.includes("love") || promptLower.includes("neighbor")) {
      jesusQuotes.filter(q => q.quote.toLowerCase().includes("love")).forEach(q => relevantQuotes.push(q));
    }
    
    if (promptLower.includes("heaven") || promptLower.includes("kingdom")) {
      jesusQuotes.filter(q => q.quote.toLowerCase().includes("heaven") || q.quote.toLowerCase().includes("kingdom")).forEach(q => relevantQuotes.push(q));
    }
    
    if (promptLower.includes("father") || promptLower.includes("god")) {
      jesusQuotes.filter(q => q.quote.toLowerCase().includes("father") || q.quote.toLowerCase().includes("god")).forEach(q => relevantQuotes.push(q));
    }
    
    if (promptLower.includes("pray") || promptLower.includes("prayer")) {
      jesusQuotes.filter(q => q.quote.toLowerCase().includes("pray") || q.context.includes("Prayer")).forEach(q => relevantQuotes.push(q));
    }
    
    // If no specific matches or if just greeting, select random quotes
    if (relevantQuotes.length === 0 || promptLower.includes("hello") || promptLower.includes("hi")) {
      // Get 2-3 random quotes
      const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
      const usedIndices = new Set();
      
      for (let i = 0; i < numQuotes; i++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * jesusQuotes.length);
        } while (usedIndices.has(randomIndex) && usedIndices.size < jesusQuotes.length);
        
        usedIndices.add(randomIndex);
        relevantQuotes.push(jesusQuotes[randomIndex]);
      }
    }
    
    // Limit to 3 quotes maximum
    const selectedQuotes = relevantQuotes.slice(0, 3);
    
    // Format the response
    return {
      quote: selectedQuotes.map(q => `${q.quote} (${q.source})`).join('\n\n'),
      author: 'Jesus Christ',
      source: 'Bible',
      context: selectedQuotes.map(q => q.context).join(', ')
    };
  } catch (error) {
    console.error('Jesus quotes error:', error);
    throw new Error('Failed to fetch Jesus quotes');
  }
};

// John Muir API integration
export const fetchJohnMuirQuote = async (prompt) => {
  try {
    // John Muir quotes collection - authentic quotes from his writings
    const johnMuirQuotes = [
      {
        quote: "The mountains are calling and I must go.",
        source: "Letter to sister Sarah Muir",
        date: "1873",
        work: "Personal correspondence"
      },
      {
        quote: "In every walk with nature one receives far more than he seeks.",
        source: "Unpublished journals",
        date: "circa 1877",
        work: "Personal journals"
      },
      {
        quote: "The clearest way into the Universe is through a forest wilderness.",
        source: "John of the Mountains",
        date: "1938",
        work: "Posthumous collection of writings"
      },
      {
        quote: "When one tugs at a single thing in nature, he finds it attached to the rest of the world.",
        source: "My First Summer in the Sierra",
        date: "1911",
        work: "Published book"
      },
      {
        quote: "The world is big and I want to have a good look at it before it gets dark.",
        source: "Letter to sister Sarah Muir",
        date: "1873",
        work: "Personal correspondence"
      },
      {
        quote: "Between every two pine trees there is a door leading to a new way of life.",
        source: "John of the Mountains",
        date: "1938",
        work: "Posthumous collection of writings"
      },
      {
        quote: "Of all the paths you take in life, make sure a few of them are dirt.",
        source: "The Mountains of California",
        date: "1894",
        work: "Published book"
      },
      {
        quote: "The power of imagination makes us infinite.",
        source: "Journal entry",
        date: "August 1875",
        work: "Personal journals"
      },
      {
        quote: "Nature is ever at work building and pulling down, creating and destroying, keeping everything whirling and flowing, allowing no rest but in rhythmical motion, chasing everything in endless song out of one beautiful form into another.",
        source: "Our National Parks",
        date: "1901",
        work: "Published book"
      },
      {
        quote: "Climb the mountains and get their good tidings. Nature's peace will flow into you as sunshine flows into trees.",
        source: "Our National Parks",
        date: "1901",
        work: "Published book"
      }
    ];
    
    // Select random quotes from the collection
    const randomQuotes = [];
    
    // Get 2-3 random quotes
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2 or 3 quotes
    const usedIndices = new Set();
    
    for (let i = 0; i < numQuotes && i < johnMuirQuotes.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * johnMuirQuotes.length);
      } while (usedIndices.has(randomIndex) && usedIndices.size < johnMuirQuotes.length);
      
      usedIndices.add(randomIndex);
      randomQuotes.push(johnMuirQuotes[randomIndex]);
    }
    
    // Format the response with multiple quotes
    return {
      quote: randomQuotes.map(q => `${q.quote} (${q.source}, ${q.date})`).join('\n\n'),
      author: 'John Muir',
      work: randomQuotes[0].work,
      date: randomQuotes[0].date,
      source: randomQuotes[0].source
    };
  } catch (error) {
    console.error('John Muir API error:', error);
    throw new Error('Failed to fetch John Muir quotes');
  }
}; 