"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase, supabaseConfigured } from "./supabaseClient";
import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  GraduationCap,
  HelpCircle,
  Home,
  Upload,
  Lightbulb,
  LineChart,
  ListFilter,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  X
} from "lucide-react";

const STORAGE_KEY = "cse-pro-2026-mastery-simulator";
const TRIAL_MINUTES = 60;
const MAX_ACTIVE_DEVICES = 2;
const MOCK_EXAM_MODES = Array.from({ length: 10 }, (_, i) => `Mock Exam ${i + 1}`);
const FOUNDING_MEMBER_LIMIT = 30;

const CATEGORIES = [
  {
    name: "Verbal Ability",
    short: "Verbal",
    icon: BookOpen,
    accent: "from-sky-400 to-emerald-300",
    subs: ["Grammar and Correct Usage", "Vocabulary", "Synonyms", "Antonyms", "Sentence Completion", "Reading Comprehension", "Paragraph Organization", "Verbal Reasoning"]
  },
  {
    name: "Analytical Ability",
    short: "Analytical",
    icon: Brain,
    accent: "from-fuchsia-400 to-cyan-300",
    subs: ["Analogy", "Logic", "Assumptions", "Conclusions", "Word Association", "Data Interpretation", "Pattern Recognition", "Critical Thinking"]
  },
  {
    name: "Numerical Ability",
    short: "Numerical",
    icon: BarChart3,
    accent: "from-amber-300 to-teal-300",
    subs: ["Basic Operations", "Fractions", "Decimals", "Percentages", "Ratios and Proportions", "Profit and Loss", "Discounts", "Word Problems", "Number Series", "Simple Interest"]
  },
  {
    name: "General Information",
    short: "General Info",
    icon: ShieldCheck,
    accent: "from-rose-300 to-lime-300",
    subs: ["Philippine Constitution", "RA 6713", "Human Rights", "Environmental Management", "Government Structure", "Public Service Values", "Current Events"]
  }
];

const BUILT_IN_REVIEWERS = [
  "105 VOCABULARY WORDS NA LUMABAS SA PREVIOUS EXAMS",
  "Vocabulary (for prof and subprof)",
  "Grammar (for prof and subprof)",
  "General Info (for prof and subprof)",
  "Statements and Conclusions (For Prof only)",
  "Word analogy (For Prof only)",
  "Logic (for prof only)",
  "Numerical Reasoning (for prof and subprof)",
  "Math Word Problems (for prof and subprof)",
  "Key Words Used in Word Problems",
  "Math Formulas"
];

const TOPIC_KEYWORDS = {
  "Verbal Ability": ["grammar", "vocabulary", "synonym", "antonym", "sentence", "reading", "paragraph", "word"],
  "Numerical Ability": ["math", "numerical", "fraction", "percent", "ratio", "problem", "formula", "interest", "profit"],
  "Analytical Ability": ["logic", "analogy", "conclusion", "statement", "assumption", "pattern", "reasoning"],
  "General Information": ["general", "constitution", "rights", "government", "public", "environment", "ra 6713"]
};

const TOPIC_LESSONS = CATEGORIES.flatMap((cat) => cat.subs.map((topic) => ({
  id: `${cat.short}-${topic}`.replace(/\s+/g, "-").toLowerCase(),
  category: cat.name,
  topic,
  introduction: `${topic} is a high-value area in the Civil Service Professional exam because it tests both knowledge and judgment under time pressure.`,
  explanation: `Master ${topic} by learning the core rule, recognizing common item patterns, and practicing until you can explain why each wrong option fails.`,
  examples: [`Identify the rule behind a ${topic} item before checking the choices.`, `Eliminate choices that answer a different issue or use the wrong operation.`],
  commonMistakes: ["Answering by familiarity instead of evidence", "Ignoring keywords in the question", "Rushing before identifying the tested rule"],
  stepGuide: ["Read the question stem carefully", "Name the topic or formula being tested", "Eliminate two weak choices", "Verify the best answer against the rule", "Review the explanation after answering"],
  notes: `${topic} improves fastest when you review mistakes immediately and retry similar questions.`,
  memoryAid: `Rule first, choice second: label the ${topic} rule before selecting an answer.`,
  techniques: ["Use elimination", "Watch absolute words", "Check units and qualifiers", "Do not overthink beyond the given facts"],
  tips: ["Prioritize accuracy in practice, then speed", "Track weak topics weekly", "Redo missed questions until they become easy"],
  dos: ["Read all choices", "Use scratch notes", "Review wrong answers"],
  donts: ["Do not guess from answer patterns", "Do not skip explanations", "Do not memorize without understanding"]
})));

const NUMERICAL_LESSON_DETAILS = {
  "Basic Operations": {
    formulas: ["MDAS/GEMDAS: grouping first, then multiplication/division, then addition/subtraction"],
    example: "Compute 18 + 6 x 4 = 18 + 24 = 42.",
    shortcut: "Circle multiplication and division groups before adding.",
    mental: "Break numbers into friendly parts, such as 48 x 5 = 50 x 5 - 2 x 5.",
    drill: "Solve 10 mixed-operation items without a calculator."
  },
  Fractions: {
    formulas: ["a/b + c/d = (ad + bc) / bd", "a/b x c/d = ac/bd"],
    example: "1/3 + 2/5 = 5/15 + 6/15 = 11/15.",
    shortcut: "Use cross-products for two-fraction addition.",
    mental: "Reduce before multiplying to keep numbers small.",
    drill: "Practice adding unlike fractions and simplifying answers."
  },
  Decimals: {
    formulas: ["Decimal percent conversion: decimal x 100 = percent"],
    example: "0.375 x 100 = 37.5%.",
    shortcut: "Move the decimal point two places right to convert to percent.",
    mental: "Memorize benchmark decimals: .25, .50, .75, .125.",
    drill: "Convert 20 decimals to fractions and percentages."
  },
  Percentages: {
    formulas: ["Percentage = Part / Whole x 100", "Part = Rate x Whole"],
    example: "20 is what percent of 80? 20 / 80 = 0.25; 0.25 x 100 = 25%.",
    shortcut: "For 10%, move one decimal place; build 5%, 15%, 25% from benchmarks.",
    mental: "25% means one-fourth; 50% means half; 75% means three-fourths.",
    drill: "Find 5%, 10%, 15%, 20%, and 25% of common amounts."
  },
  "Ratios and Proportions": {
    formulas: ["a:b = a/b", "a/b = c/d means ad = bc"],
    example: "If 3:5 totals 80, one part is 80 / 8 = 10, so shares are 30 and 50.",
    shortcut: "Add ratio parts first when the total is given.",
    mental: "Reduce ratios before comparing.",
    drill: "Split totals using two-part and three-part ratios."
  },
  "Profit and Loss": {
    formulas: ["Profit = Selling Price - Cost", "Profit Rate = Profit / Cost x 100"],
    example: "Cost 800, selling price 1,000: profit = 200; rate = 200/800 x 100 = 25%.",
    shortcut: "Use cost as the base unless the question says otherwise.",
    mental: "A 20% profit means selling price is 120% of cost.",
    drill: "Compute profit, loss, and selling price from changing bases."
  },
  Discounts: {
    formulas: ["Discount = Rate x Marked Price", "Sale Price = Marked Price - Discount"],
    example: "20% discount on 1,500: discount = 300; sale price = 1,200.",
    shortcut: "Sale price after 20% off is 80% of marked price.",
    mental: "Combine discounts step by step, not by direct addition unless specified.",
    drill: "Calculate single and successive discounts."
  },
  "Word Problems": {
    formulas: ["Distance = Rate x Time", "Work rate = 1 / time", "Mixture pure amount = percent x quantity"],
    example: "At 60 km/h for 3 hours, distance = 60 x 3 = 180 km.",
    shortcut: "Underline what is asked, then label given values.",
    mental: "Convert words like total, difference, twice, and remaining into operations.",
    drill: "Solve one age, one work, one mixture, and one distance item daily."
  },
  "Number Series": {
    formulas: ["Check addition, subtraction, multiplication, division, alternating patterns, and squares"],
    example: "3, 6, 12, 24, __ doubles each time, so next is 48.",
    shortcut: "Test first differences before trying complex rules.",
    mental: "Memorize squares 1-20 and common cubes 1-10.",
    drill: "Classify 20 series by pattern type."
  },
  "Simple Interest": {
    formulas: ["I = PRT", "Amount = Principal + Interest"],
    example: "P=5,000, R=6%, T=2: I = 5000 x .06 x 2 = 600.",
    shortcut: "Convert percent to decimal before multiplying.",
    mental: "Find 1-year interest first, then multiply by years.",
    drill: "Compute interest, principal, rate, and time from missing-variable items."
  }
};

const TOPIC_REVIEW_CONTENT = {
  "Grammar and Correct Usage": {
    lessons: ["Grammar questions test whether a sentence follows standard English rules used in formal government communication.", "Focus on subject-verb agreement, pronoun reference, tense consistency, modifier placement, parallel structure, and clear syntax."],
    definitions: ["Subject: the person or thing doing or being described.", "Verb: the action or state of being.", "Modifier: a word or phrase that describes another word and must be placed near what it modifies."],
    concepts: ["Singular subjects take singular verbs; plural subjects take plural verbs.", "Pronouns must clearly refer to a specific noun and match it in number and person.", "Parallel ideas must use the same grammatical form."],
    rules: ["Ignore interrupting phrases when matching subject and verb.", "Keep verb tense consistent unless the time frame changes.", "Use objective pronouns after prepositions: for him, with her, to them."],
    examples: ["Correct: The committee approves the report.", "Correct: The employees submitted their forms on time.", "Incorrect: Each of the clerks have a copy."],
    worked: ["Item: Each of the applicants ___ required to submit an ID. Solution: The subject is Each, which is singular. Answer: is."],
    tips: ["Find the true subject before choosing the verb.", "Check pronoun reference when two nouns appear in one sentence.", "For lists, test whether each item follows the same pattern."],
    mistakes: ["Matching the verb with the nearest noun instead of the real subject.", "Changing tense midway through a sentence.", "Using they/their when the noun is singular and the sentence needs formal agreement."],
    patterns: ["Error identification items with underlined sentence parts.", "Best correction items for formal office sentences.", "Sentence completion items where grammar and meaning both matter."],
    memory: ["S-V-P: Subject first, Verb match, Pronoun clear."]
  },
  Vocabulary: {
    lessons: ["Vocabulary items measure precise word meaning in civil service contexts such as reports, memoranda, and public advisories.", "You must choose the word that best fits tone, context, and official meaning."],
    definitions: ["Denotation: the literal dictionary meaning.", "Connotation: the emotional or formal association of a word.", "Context clue: nearby information that reveals meaning."],
    concepts: ["Formal public-service writing favors exact and neutral words.", "A word can be correct in meaning but wrong in tone.", "Context clues may show contrast, cause, example, or definition."],
    rules: ["Read the full sentence before checking choices.", "Replace the blank with each option and test meaning plus tone.", "Use prefixes and roots when the word is unfamiliar."],
    examples: ["Prudent means careful and wise.", "Impartial means fair and unbiased.", "Expedite means to make a process faster."],
    worked: ["Item: The officer must remain impartial. Solution: In a complaint setting, impartial means not favoring either side. Answer: unbiased."],
    tips: ["Watch government words: accountable, transparent, prudent, equitable, comply.", "Eliminate words that are too emotional for official writing.", "Use contrast clues after however, although, despite, or but."],
    mistakes: ["Choosing a familiar word without checking context.", "Confusing similar words such as imply/infer or affect/effect.", "Ignoring whether the sentence needs a positive or negative meaning."],
    patterns: ["Synonym selection.", "Best word in a formal sentence.", "Meaning from context in short public-service passages."],
    memory: ["MCT: Meaning, Context, Tone."]
  },
  Synonyms: {
    lessons: ["Synonym items ask for the word closest in meaning, not always exactly identical.", "The best synonym must match the sentence context and level of formality."],
    definitions: ["Synonym: a word with the same or nearly the same meaning.", "Register: the level of formality of a word."],
    concepts: ["Near-synonyms differ in strength, tone, and usage.", "Civil service items often use formal words found in memoranda and policies."],
    rules: ["Define the target word in your own words first.", "Check if the choice has the same positive, negative, or neutral sense.", "Avoid choices that are related but not equivalent."],
    examples: ["Diligent = hardworking.", "Concise = brief but complete.", "Comply = obey or follow."],
    worked: ["Item: Choose the synonym of transparent. Solution: In governance, transparent means open and clear. Answer: open."],
    tips: ["Look for root clues: bene means good, mal means bad, trans means across or clear.", "Prefer the closest meaning over the most impressive word."],
    mistakes: ["Choosing an antonym because it looks familiar.", "Choosing a word from the same topic but different meaning.", "Ignoring whether the word is used as noun, verb, or adjective."],
    patterns: ["Single-word synonym questions.", "Sentence-based synonym questions.", "Formal governance vocabulary questions."],
    memory: ["Same sense, same tone, same use."]
  },
  Antonyms: {
    lessons: ["Antonym items ask for the opposite meaning of a target word.", "The correct answer must oppose the exact sense used in the item."],
    definitions: ["Antonym: a word with opposite meaning.", "Polarity: whether a word has positive, negative, or neutral force."],
    concepts: ["Some words have more than one opposite depending on context.", "Prefixes can signal opposition: un-, in-, im-, dis-, non-."],
    rules: ["State the target word meaning first, then reverse it.", "Check if the choice is truly opposite, not merely different.", "Use sentence context when the target word has multiple meanings."],
    examples: ["Transparent vs secretive.", "Diligent vs negligent.", "Scarce vs abundant."],
    worked: ["Item: Antonym of impartial. Solution: Impartial means fair and unbiased; the opposite is biased."],
    tips: ["Watch negative prefixes, but verify the resulting word exists and fits.", "Eliminate neutral alternatives that do not oppose the target."],
    mistakes: ["Selecting a synonym instead of an antonym.", "Choosing a weaker related word, not the true opposite.", "Forgetting that some antonyms change by context."],
    patterns: ["Direct antonym items.", "Antonym in sentence context.", "Public ethics vocabulary opposites."],
    memory: ["Define, flip, verify."]
  },
  "Sentence Completion": {
    lessons: ["Sentence completion tests grammar, vocabulary, logic, and tone in one item.", "The correct word or phrase must complete the thought without creating grammar or meaning errors."],
    definitions: ["Signal word: a word like however, therefore, although, or because that shows sentence logic.", "Collocation: words that naturally go together."],
    concepts: ["Contrast signals require an opposite idea.", "Cause-effect signals require a logical result.", "Formal sentences require precise and professional wording."],
    rules: ["Read before and after the blank.", "Identify whether the sentence needs contrast, cause, example, or continuation.", "Check grammar after inserting the choice."],
    examples: ["Although the request was urgent, the officer remained prudent.", "The form was incomplete; therefore, it was returned."],
    worked: ["Item: The policy was implemented to ___ delays. Solution: The sentence needs a verb meaning reduce or prevent. Answer: minimize."],
    tips: ["Underline signal words before looking at choices.", "Reject choices that sound grammatical but break the logic.", "Prefer formal wording in official contexts."],
    mistakes: ["Choosing the longest option.", "Ignoring the second half of the sentence.", "Missing contrast words such as despite or although."],
    patterns: ["One-blank vocabulary completion.", "Grammar-based completion.", "Logic connector completion."],
    memory: ["Signal, sense, sentence."]
  },
  "Reading Comprehension": {
    lessons: ["Reading comprehension measures whether you can identify what a passage says, implies, and supports.", "Civil service passages often discuss governance, service delivery, ethics, environment, or workplace situations."],
    definitions: ["Main idea: the central point of the passage.", "Inference: a conclusion supported by the passage but not directly stated.", "Tone: the writer's attitude."],
    concepts: ["Main idea is broader than a detail but narrower than an unrelated theme.", "Inference must be based on evidence, not personal opinion.", "Supporting details prove or explain the main idea."],
    rules: ["Read the question first if time is limited.", "Locate evidence lines before answering.", "For inference, ask what must be true based on the passage."],
    examples: ["If a passage lists benefits of online filing, the main idea may be improved service efficiency.", "A cautious tone uses words like may, should, risks, or requires."],
    worked: ["Item: What is the main idea of a passage about reducing queue time? Solution: Combine repeated details about faster processing and citizen convenience. Answer: improved public service efficiency."],
    tips: ["Eliminate choices that are true but too narrow.", "Avoid choices that add information not in the passage.", "Tone is usually neutral, informative, critical, or encouraging."],
    mistakes: ["Answering from stock knowledge instead of the passage.", "Choosing a detail as the main idea.", "Treating a possible idea as a required inference."],
    patterns: ["Main idea questions.", "Context clue vocabulary.", "Inference and tone questions.", "Supporting detail checks."],
    memory: ["E-B-A: Evidence before answer."]
  },
  "Paragraph Organization": {
    lessons: ["Paragraph organization tests whether sentences follow a logical order.", "You must identify the introduction, development, transitions, and conclusion."],
    definitions: ["Topic sentence: introduces the main idea.", "Transition: connects one idea to another.", "Concluding sentence: closes or summarizes the paragraph."],
    concepts: ["General statements usually come before specific examples.", "Pronouns and transition words depend on earlier sentences.", "Conclusions often restate the main point or give a final result."],
    rules: ["Find the sentence that introduces the topic without needing prior context.", "Place examples after the idea they explain.", "Use pronoun clues: this, these, such, it, they."],
    examples: ["First: Online services reduce waiting time. Next: Citizens can submit forms through a portal. Last: Thus, digital processing improves access."],
    worked: ["Item: Which sentence should come first? Solution: Choose the sentence that names the topic and does not refer to earlier details."],
    tips: ["Look for chronological words: first, next, finally.", "Find cause before effect.", "Put definitions before examples."],
    mistakes: ["Starting with a sentence that says this or therefore.", "Putting a conclusion before evidence.", "Ignoring repeated keywords."],
    patterns: ["Arrange sentences in logical order.", "Best introductory sentence.", "Best concluding statement."],
    memory: ["G-E-C: General, Evidence, Conclusion."]
  },
  "Verbal Reasoning": {
    lessons: ["Verbal reasoning asks you to evaluate meaning, relationships, and conclusions expressed in words.", "It combines vocabulary, logic, and careful reading."],
    definitions: ["Claim: a statement being asserted.", "Evidence: support for a claim.", "Conclusion: the idea that follows from evidence."],
    concepts: ["A conclusion must be supported by the given words.", "A strong answer does not add outside assumptions.", "Word relationships can show cause, category, function, or contrast."],
    rules: ["Separate facts from opinions.", "Identify the exact claim before choosing a conclusion.", "Reject choices that exaggerate the statement."],
    examples: ["If all applicants submitted IDs, it follows each applicant has an ID on file.", "If some offices use online forms, it does not mean all offices do."],
    worked: ["Item: All valid permits have signatures. This permit has no signature. Solution: It cannot be a valid permit under the rule."],
    tips: ["Watch quantifiers: all, some, none, most.", "Do not convert some into all.", "Use only the information given."],
    mistakes: ["Adding real-world assumptions.", "Confusing probable with certain.", "Ignoring limiting words."],
    patterns: ["Best conclusion.", "Statement implication.", "Meaning relationship items."],
    memory: ["Words given, logic proven."]
  }
};

const TOPIC_ALIASES = {
  "Basic Operations": { root: "Basic Operations", extra: ["Addition and subtraction combine quantities and differences.", "Multiplication is repeated grouping; division separates into equal parts.", "Order of operations: parentheses, multiplication/division, addition/subtraction."] },
  Fractions: { root: "Fractions", extra: ["Proper fractions are less than one; improper fractions are one or greater.", "Mixed numbers combine a whole number and a fraction.", "LCD lets unlike denominators become comparable."] },
  Decimals: { root: "Decimals", extra: ["Decimals express parts of a whole using place value.", "Tenths, hundredths, and thousandths determine the size of each digit.", "Align decimal points before adding or subtracting."] },
  Percentages: { root: "Percentages", extra: ["Percent means per hundred.", "Percentage = Part / Whole x 100.", "Increase and decrease items compare the change to the original value."] },
  "Ratios and Proportions": { root: "Ratios and Proportions", extra: ["A ratio compares quantities.", "A proportion states that two ratios are equal.", "Cross multiplication solves missing proportion values."] },
  "Profit and Loss": { root: "Profit and Loss", extra: ["Profit equals selling price minus cost.", "Loss equals cost minus selling price.", "Profit or loss rate usually uses cost as the base."] },
  Discounts: { root: "Discounts", extra: ["Discount equals rate times marked price.", "Sale price equals marked price minus discount.", "Successive discounts are applied one after another."] },
  "Word Problems": { root: "Word Problems", extra: ["Translate words into equations before solving.", "Distance = rate x time.", "Work problems use fractional work rates."] },
  "Number Series": { root: "Number Series", extra: ["Number series items test pattern recognition.", "Check differences, ratios, alternating rules, squares, and cubes.", "Do not stop after one term; verify the pattern across the series."] },
  "Simple Interest": { root: "Simple Interest", extra: ["Simple interest uses I = PRT.", "Rate must be converted to decimal.", "Amount equals principal plus interest."] },
  Analogy: { root: "Analogy", extra: ["Analogies compare relationships, not just word meanings.", "Common relationships include function, category, part-whole, cause-effect, and degree.", "State the bridge sentence before checking options."] },
  Logic: { root: "Logic", extra: ["Logic questions test whether a conclusion necessarily follows.", "Use only the stated premises.", "Valid reasoning preserves the structure of the given statements."] },
  Assumptions: { root: "Assumptions", extra: ["An assumption is an unstated idea needed for an argument to work.", "If removing a statement weakens the argument, it may be an assumption.", "Assumptions connect evidence to conclusion."] },
  Conclusions: { root: "Conclusions", extra: ["A conclusion must be supported by the statements.", "Strong conclusions do not add facts beyond the premises.", "Quantifiers control what can be concluded."] },
  "Word Association": { root: "Word Association", extra: ["Word association tests semantic links.", "Look for category, function, location, user, tool, or opposite relationships.", "Do not choose a word merely because it is familiar."] },
  "Data Interpretation": { root: "Data Interpretation", extra: ["Data interpretation uses tables, charts, and percentages.", "Read labels, units, and totals first.", "Compare values only after confirming the base."] },
  "Pattern Recognition": { root: "Pattern Recognition", extra: ["Patterns can be numerical, visual, alphabetical, or logical.", "Test simple rules before complex ones.", "Look for alternating sequences and position-based changes."] },
  "Critical Thinking": { root: "Critical Thinking", extra: ["Critical thinking evaluates evidence, assumptions, and weak reasoning.", "A fallacy is a flaw in reasoning.", "Strong answers stay relevant to the claim."] },
  "Philippine Constitution": { root: "Philippine Constitution", extra: ["The Constitution is the fundamental law of the Philippines.", "High-yield areas include general principles, Bill of Rights, citizenship, suffrage, and branches of government.", "Government powers are distributed among legislative, executive, and judicial branches."] },
  "RA 6713": { root: "RA 6713", extra: ["RA 6713 is the Code of Conduct and Ethical Standards for Public Officials and Employees.", "Core norms include commitment to public interest, professionalism, justness, political neutrality, responsiveness, nationalism, democracy, and simple living.", "Public office is a public trust."] },
  "Human Rights": { root: "Human Rights", extra: ["Human rights protect dignity, equality, and freedom.", "Civil service items often ask how public employees should treat citizens fairly.", "Rights-based service avoids discrimination and respects due process."] },
  "Environmental Management": { root: "Environmental Management", extra: ["Environmental management balances development, health, and sustainability.", "High-yield concepts include waste segregation, climate change, conservation, pollution control, and ecological responsibility.", "Government programs must consider long-term public welfare."] },
  "Government Structure": { root: "Government Structure", extra: ["The Philippine government has legislative, executive, and judicial branches.", "Checks and balances prevent abuse of power.", "Local government units deliver many frontline services."] },
  "Public Service Values": { root: "Public Service Values", extra: ["Public service values guide ethical government work.", "Key values include accountability, transparency, responsiveness, fairness, and integrity.", "Situational items ask what a public employee should do under pressure."] },
  "Current Events": { root: "Current Events", extra: ["Current events questions test awareness of public issues and government responses.", "Focus on national issues, public health, economy, disaster response, environment, technology, and governance.", "Use verified information and avoid rumor-based conclusions."] }
};

function reviewContentFor(category, topic) {
  const direct = TOPIC_REVIEW_CONTENT[topic];
  if (direct) return direct;
  const alias = TOPIC_ALIASES[topic];
  const numerical = NUMERICAL_LESSON_DETAILS[topic];
  if (numerical) {
    return {
      lessons: [`${topic} questions test computation accuracy and speed.`, ...(alias?.extra || [])],
      definitions: alias?.extra || [`${topic} is a core numerical reasoning topic.`],
      concepts: [numerical.formulas.join(" "), numerical.mental, numerical.shortcut],
      rules: numerical.formulas,
      examples: [numerical.example],
      worked: [`Worked solution: ${numerical.example}`],
      tips: [numerical.shortcut, numerical.mental],
      mistakes: ["Using the wrong base value.", "Skipping unit conversion.", "Rounding too early before the final answer."],
      patterns: [`Direct ${topic} computation.`, `${topic} word problem translation.`, `Missing-value ${topic} items.`],
      memory: [numerical.drill]
    };
  }
  if (alias) {
    return {
      lessons: [`${topic} is a high-yield Civil Service topic.`, ...(alias.extra || [])],
      definitions: alias.extra || [`Key terms and principles under ${topic}.`],
      concepts: alias.extra || [`Recognize the tested relationship in ${topic}.`],
      rules: [`Use the specific rule or principle tested by ${topic}.`, "Match the answer to the facts stated in the item."],
      examples: [`A ${topic} item may ask for the principle that best applies to a public-service scenario.`],
      worked: [`Worked approach: identify the ${topic} principle, eliminate unrelated options, then choose the answer supported by the facts.`],
      tips: [`For ${topic}, name the exact relationship or principle before reading choices.`],
      mistakes: ["Using outside assumptions.", "Choosing a related but unsupported option.", "Ignoring qualifiers such as all, some, only, or except."],
      patterns: [`Definition of ${topic}.`, `Scenario application of ${topic}.`, `Best conclusion or best action under ${topic}.`],
      memory: [`Topic cue: ${topic} asks for exact rule application, not memorized letter patterns.`]
    };
  }
  return TOPIC_REVIEW_CONTENT.Vocabulary;
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const rankLevels = [
  { name: "Beginner", threshold: 0 },
  { name: "Developing", threshold: 40 },
  { name: "Proficient", threshold: 60 },
  { name: "Mastered", threshold: 80 }
];

const choiceLetters = ["A", "B", "C", "D"];
const mod = (n, m) => ((n % m) + m) % m;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const uid = (prefix, i) => `${prefix}-${String(i + 1).padStart(3, "0")}`;

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

function seededShuffle(items, seedText) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function arrangeChoices(choices, answer, id) {
  const answerIndex = hashText(`${id}|${answer}|cse-choice-slot`) % 4;
  const distractors = seededShuffle(choices.filter((choice) => choice !== answer), `${id}-distractors`);
  const arranged = [];
  let distractorIndex = 0;
  for (let i = 0; i < 4; i++) {
    arranged.push(i === answerIndex ? answer : distractors[distractorIndex++]);
  }
  return arranged;
}

const OVERUSED_DISTRACTORS = new Set([
  "unrelated to the report",
  "limited to private use",
  "done without care",
  "private advantage over public duty",
  "unverified rumor as policy basis",
  "arbitrary treatment without standards",
  "choose the longest option without checking the rule",
  "ignore keywords and rely on memory only",
  "use the same answer letter pattern from previous items"
]);

const DISTRACTOR_POOLS = {
  "Verbal Ability": {
    default: ["partly related but too informal", "grammatical but illogical in context", "formal-sounding but imprecise", "opposite in tone to the sentence", "too broad for the passage evidence", "uses the wrong word relationship", "changes the intended time frame", "confuses cause with result", "fits casual speech but not official writing", "adds an unsupported idea"],
    Synonyms: ["related but weaker in meaning", "similar in topic but different in use", "a common false synonym", "a word with the opposite tone", "a broader word than the sentence requires", "a narrower word than the target meaning"],
    Antonyms: ["a synonym rather than an opposite", "a neutral word, not an opposite", "a related action with no contrast", "an opposite of the wrong sense", "a milder word that does not reverse meaning", "a formal word with unrelated meaning"],
    Vocabulary: ["a related workplace term", "a near meaning with wrong tone", "a familiar but inaccurate meaning", "a context clue from another sentence type", "a word that fits grammar but not meaning", "a partial meaning only"],
    "Grammar and Correct Usage": ["agrees with the nearest noun only", "uses the wrong pronoun case", "shifts tense without reason", "breaks parallel structure", "creates an unclear modifier", "uses informal syntax"],
    "Reading Comprehension": ["a minor detail, not the main idea", "an inference not proven by the passage", "an outside fact not stated", "a tone stronger than the passage supports", "a conclusion that reverses the evidence", "a supporting detail used as the central point"]
  },
  "Analytical Ability": {
    default: ["reverses the premise", "assumes more than the facts state", "confuses a possibility with certainty", "uses a related but invalid relationship", "ignores the limiting word in the statement", "draws a conclusion from outside information", "matches the topic but not the logic", "treats some as all", "confuses sequence with cause", "uses an unsupported shortcut"],
    "Data Interpretation": ["adds values that should be compared", "uses the wrong base", "reads the trend backward", "compares different units", "uses percentage points as percent change", "ignores the table heading"],
    Logic: ["affirms the consequent", "denies the antecedent", "overgeneralizes from one case", "changes all into some", "uses an unsupported assumption", "reverses sufficient and necessary conditions"]
  },
  "General Information": {
    default: ["political loyalty over public duty", "personal discretion without legal basis", "private convenience over public accountability", "informal practice over written policy", "selective service for favored persons", "confidentiality breach as transparency", "delay without valid public reason", "unequal treatment without classification", "punishment without due process", "agency action outside legal authority"],
    "Philippine Constitution": ["rule by one branch alone", "unlimited government power", "rights suspended without lawful basis", "private rule replacing public law", "absence of checks and balances", "discretion without constitutional limits"],
    "Government Structure": ["one office exercising all powers", "courts implementing executive programs", "local units abolishing national law", "legislators deciding individual court cases", "administrative offices ignoring checks and balances", "private groups replacing public authority"],
    "Current Events": ["viral claims without verification", "reaction without public data", "policy based only on rumor", "ignoring affected communities", "short-term publicity without service impact", "unverified social media posts as official basis"],
    "Public Service Values": ["favoritism toward acquaintances", "concealing records to avoid criticism", "accepting gifts from regulated parties", "using office resources for private work", "delaying service without explanation", "retaliating against a complainant"]
  }
};

const COMMON_DISTRACTOR_POOL = [
  "uses a rule from another topic",
  "matches one keyword but not the whole item",
  "is reasonable sounding but unsupported",
  "confuses the condition with the result",
  "uses an incomplete reading of the question",
  "treats an example as the general rule",
  "applies the correct idea to the wrong detail",
  "overlooks the required qualifier",
  "answers what is familiar instead of what is asked",
  "uses a shortcut that does not apply here",
  "misreads the relationship between the facts",
  "focuses on a minor clue only",
  "changes the scope of the original statement",
  "uses a partial solution as the final answer",
  "ignores the most direct evidence",
  "confuses formal meaning with casual usage",
  "uses a public-service value from a different situation",
  "selects an action before identifying the rule",
  "assumes a fact not supplied by the item",
  "uses a comparison with the wrong reference point"
];

const WORD_DISTRACTOR_POOLS = {
  Synonyms: ["careful", "fair", "brief", "clear", "accurate", "prompt", "open", "lawful", "proper", "reliable", "orderly", "reasonable", "consistent", "responsive", "complete", "neutral"],
  Antonyms: ["reckless", "biased", "careless", "unclear", "wordy", "secretive", "delayed", "improper", "inaccurate", "unreliable", "inconsistent", "negligent", "irrelevant", "disorganized", "unfair", "obsolete"],
  Vocabulary: ["prudent", "impartial", "meticulous", "concise", "transparent", "diligent", "coherent", "viable", "relevant", "accessible", "accurate", "formal", "courteous", "feasible", "ethical", "resilient"]
};

const isLexicalTopic = (category, subCategory) => category === "Verbal Ability" && ["Vocabulary", "Synonyms", "Antonyms"].includes(subCategory);

function cleanQuestionText(text) {
  let cleaned = String(text || "")
    .replace(/^Item\s+[A-Z0-9-]+(?:-V\d+)*:\s*/i, "")
    .replace(/^Variant\s+\d+:\s*/i, "")
    .trim();
  cleaned = cleaned.replace(/(?:In an? [a-z ]+ scenario,\s*){2,}/gi, (match) => {
    const first = match.match(/In an? [a-z ]+ scenario,\s*/i)?.[0] || "";
    return first;
  });
  for (let i = 0; i < 4; i++) {
    cleaned = cleaned.replace(/^(In an? [a-z ]+ scenario,\s*)\1+/i, "$1");
  }
  return cleaned.trim();
}

function plausibleDistractors(category, subCategory, answer, id) {
  const categoryPool = DISTRACTOR_POOLS[category] || {};
  const pool = [
    ...(categoryPool[subCategory] || []),
    ...(categoryPool.default || []),
    ...COMMON_DISTRACTOR_POOL
  ];
  const answerText = String(answer).toLowerCase();
  return seededShuffle(pool, `${id}-${category}-${subCategory}-plausible-distractors`)
    .filter((choice) => choice && choice.toLowerCase() !== answerText && !answerText.includes(choice.toLowerCase()))
    .filter((choice, index, arr) => arr.indexOf(choice) === index);
}

function qualityChoices(choices, answer, category, subCategory, id) {
  const isNumerical = category === "Numerical Ability";
  if (isLexicalTopic(category, subCategory)) {
    const pool = WORD_DISTRACTOR_POOLS[subCategory] || WORD_DISTRACTOR_POOLS.Vocabulary;
    const wordOnly = (choice) => /^[A-Za-z][A-Za-z-]{1,24}$/.test(String(choice));
    const lexical = [...new Set([answer, ...choices.filter(wordOnly), ...seededShuffle(pool, `${id}-word-pool`)])]
      .filter((choice) => choice && wordOnly(choice));
    return [answer, ...seededShuffle(lexical.filter((choice) => choice !== answer), `${id}-lexical-trim`).slice(0, 3)];
  }
  const clean = [...new Set([answer, ...choices])].filter(Boolean);
  const filtered = isNumerical ? clean : clean.filter((choice) => choice === answer || !OVERUSED_DISTRACTORS.has(String(choice).toLowerCase()));
  const result = [answer, ...filtered.filter((choice) => choice !== answer)];
  if (!isNumerical) plausibleDistractors(category, subCategory, answer, id).forEach((choice) => {
    if (result.length < 16 && !result.includes(choice)) result.push(choice);
  });
  const distractors = seededShuffle(result.filter((choice) => choice !== answer), `${id}-quality-choice-trim`).slice(0, 3);
  return [answer, ...distractors];
}

function numericVariantDistractors(answer, variantIndex) {
  const text = String(answer);
  const numberMatch = text.match(/-?\d+(?:\.\d+)?/);
  if (!numberMatch) return ["Cannot be determined", "Uses the wrong operation", "Uses a different base"];
  const value = Number(numberMatch[0]);
  const suffix = text.slice(numberMatch.index + numberMatch[0].length);
  const prefix = text.slice(0, numberMatch.index);
  const offsets = [variantIndex + 2, variantIndex * 2 + 3, Math.max(1, Math.round(value * (0.08 + (variantIndex % 5) * 0.03)))];
  return offsets.map((offset, idx) => {
    const candidate = value + (idx === 1 ? -offset : offset);
    return `${prefix}${candidate > 0 ? candidate : value + offset + idx + 1}${suffix}`;
  });
}

function normalizeSubCategory(category, subCategory) {
  const listed = CATEGORIES.find((cat) => cat.name === category)?.subs || [];
  if (listed.includes(subCategory)) return subCategory;
  const text = subCategory.toLowerCase();
  if (category === "Verbal Ability") {
    if (text.includes("vocabulary")) return "Vocabulary";
    if (text.includes("synonym")) return "Synonyms";
    if (text.includes("antonym")) return "Antonyms";
    if (text.includes("paragraph")) return "Paragraph Organization";
    if (text.includes("reading") || text.includes("main idea") || text.includes("tone") || text.includes("inference") || text.includes("detail")) return "Reading Comprehension";
    if (text.includes("usage") || text.includes("syntax") || text.includes("verb") || text.includes("pronoun") || text.includes("tense") || text.includes("parallel") || text.includes("grammar")) return "Grammar and Correct Usage";
    return "Verbal Reasoning";
  }
  if (category === "Analytical Ability") {
    if (text.includes("analogy")) return "Analogy";
    if (text.includes("assumption")) return "Assumptions";
    if (text.includes("conclusion") || text.includes("deduction") || text.includes("syllogism")) return "Conclusions";
    if (text.includes("data") || text.includes("table") || text.includes("trend") || text.includes("percent")) return "Data Interpretation";
    if (text.includes("word")) return "Word Association";
    if (text.includes("fallac") || text.includes("reason")) return "Critical Thinking";
    return "Logic";
  }
  if (category === "Numerical Ability") {
    if (text.includes("fraction")) return "Fractions";
    if (text.includes("decimal")) return "Decimals";
    if (text.includes("percent")) return "Percentages";
    if (text.includes("ratio")) return "Ratios and Proportions";
    if (text.includes("interest")) return "Simple Interest";
    if (text.includes("series")) return "Number Series";
    if (text.includes("word") || text.includes("age") || text.includes("mixture") || text.includes("work") || text.includes("distance") || text.includes("algebra")) return "Word Problems";
    return "Basic Operations";
  }
  if (category === "General Information") {
    if (text.includes("constitution") || text.includes("bill") || text.includes("branch") || text.includes("checks")) return "Philippine Constitution";
    if (text.includes("6713") || text.includes("accountability") || text.includes("ethics")) return "RA 6713";
    if (text.includes("right") || text.includes("dignity") || text.includes("equality") || text.includes("social") || text.includes("peace")) return "Human Rights";
    if (text.includes("environment") || text.includes("climate") || text.includes("waste") || text.includes("sustain")) return "Environmental Management";
    return "Public Service Values";
  }
  return subCategory;
}

function makeQuestion({ id, category, subCategory, difficulty, question, choices, answer, explanation, hint, learningTip }) {
  subCategory = normalizeSubCategory(category, subCategory);
  const backupChoices = category === "Numerical Ability" ? numericVariantDistractors(answer, hashText(id) % 17 + 1) : [
    "The information given is insufficient",
    "A different rule or operation is required",
    "The statement reverses the required relationship",
    "The result answers a different question"
  ];
  const cleanChoices = qualityChoices([...new Set(choices)], answer, category, subCategory, id);
  if (!cleanChoices.includes(answer)) cleanChoices.unshift(answer);
  backupChoices.forEach((choice) => {
    if (cleanChoices.length < 4 && !cleanChoices.includes(choice)) cleanChoices.push(choice);
  });
  const rule = category === "Verbal Ability"
    ? `Rule tested: ${subCategory} accuracy. Read the sentence or passage first, then match the choice to grammar, context, and logic.`
    : category === "General Information"
      ? `Rule tested: ${subCategory}. Apply the public-service principle to the concrete government situation.`
      : "";
  const upgradedExplanation = rule ? `${rule} Why the correct answer is right: ${explanation} Why the other choices are wrong: they are either unrelated to the rule, too broad, contrary to the situation, or answer a different issue.` : explanation;
  return { id, category, subCategory, difficulty, question: cleanQuestionText(question), choices: arrangeChoices(cleanChoices.slice(0, 4), answer, id), answer, explanation: upgradedExplanation, hint, learningTip };
}

function generateVerbal() {
  const vocab = [
    ["prudent", "careful", "reckless", "decorative", "temporary", "A prudent employee verifies records before submitting a public report."],
    ["meticulous", "thorough", "careless", "silent", "ordinary", "Meticulous review prevents avoidable mistakes in official documents."],
    ["impartial", "fair", "biased", "angry", "uncertain", "An impartial officer treats all applicants under the same rule."],
    ["concur", "agree", "dispute", "delay", "inspect", "The committee members concurred after reviewing the evidence."],
    ["relevant", "connected", "unrelated", "expensive", "hidden", "Relevant documents directly support the claim being assessed."],
    ["diligent", "hardworking", "negligent", "wealthy", "brief", "A diligent clerk follows up pending requests promptly."],
    ["concise", "brief", "wordy", "confusing", "hostile", "A concise memorandum states the issue without unnecessary detail."],
    ["obsolete", "outdated", "current", "fragile", "popular", "Obsolete forms should be replaced by the latest approved version."],
    ["ambiguous", "unclear", "clear", "formal", "urgent", "Ambiguous instructions can lead to inconsistent implementation."],
    ["resilient", "adaptable", "fragile", "strict", "loud", "Resilient teams continue serving citizens during disruptions."],
    ["scrutinize", "examine", "ignore", "announce", "decorate", "Auditors scrutinize vouchers before approving payment."],
    ["coherent", "logical", "disorganized", "beautiful", "brief", "A coherent report links findings to recommendations."],
    ["viable", "workable", "impossible", "official", "distant", "A viable solution can be implemented with available resources."],
    ["exemplary", "excellent", "poor", "unusual", "private", "Exemplary conduct strengthens trust in public service."],
    ["mitigate", "lessen", "worsen", "measure", "borrow", "Early planning helps mitigate the effects of flooding."]
  ];
  const usage = [
    ["The director approved the proposal after a thorough ____ of its budget impact.", "review", ["receipt", "review", "rumor", "repair"], "The sentence needs a noun meaning careful examination."],
    ["Public servants must ____ confidential information entrusted to them.", "safeguard", ["safeguard", "advertise", "decorate", "postpone"], "The context is protecting confidential information."],
    ["The new policy will ____ the processing time for routine requests.", "reduce", ["reduce", "refuse", "replace", "repeat"], "The sentence points to making processing time shorter."],
    ["Applicants are advised to submit documents ____ the deadline.", "before", ["beside", "before", "between", "beneath"], "A time relationship is required."],
    ["The report was returned because several figures were not ____.", "accurate", ["accurate", "generous", "visible", "optional"], "Figures in a report must be correct."],
    ["The office issued a ____ reminder about the proper use of government property.", "formal", ["formal", "fragile", "distant", "random"], "An office reminder is official in tone."],
    ["The committee reached a decision after hearing ____ sides.", "both", ["both", "much", "every", "neither"], "Two sides are implied."],
    ["Citizens expect services that are prompt, fair, and ____.", "transparent", ["transparent", "secretive", "careless", "decorative"], "Fair public service should be open to scrutiny."],
    ["The memo asked employees to ____ from accepting gifts from suppliers.", "refrain", ["refrain", "retain", "repair", "remove"], "The phrase 'refrain from' means avoid doing something."],
    ["The agency launched an online portal to make transactions more ____.", "accessible", ["accessible", "accidental", "aggressive", "ancient"], "Online portals make services easier to reach."]
  ];
  const grammar = [
    ["Neither the applicants nor the examiner ____ allowed to leave before the signal.", "is", ["is", "are", "were", "have"], "With 'neither...nor,' the verb agrees with the nearer subject, examiner."],
    ["The list of qualified examinees ____ posted on the official website.", "was", ["were", "was", "have", "are"], "The subject is 'list,' which is singular."],
    ["Each of the employees ____ required to attend the ethics seminar.", "is", ["are", "were", "is", "have"], "'Each' takes a singular verb."],
    ["The committee submitted ____ recommendation before noon.", "its", ["their", "it's", "its", "them"], "A committee treated as one body uses 'its'."],
    ["She has ____ the application form carefully.", "completed", ["complete", "completed", "completing", "completes"], "Present perfect uses has + past participle."],
    ["The supervisor asked us to file reports, answer calls, and ____ visitors courteously.", "assist", ["assisting", "to assist", "assist", "assisted"], "Parallelism requires the base verb after 'to' is shared in the series."],
    ["The employee who prepared the minutes ____ already left.", "has", ["have", "has", "were", "are"], "The subject is singular employee."],
    ["If the agency ____ earlier, the delay could have been avoided.", "had acted", ["acts", "acted", "had acted", "has acted"], "A past unreal condition uses past perfect."],
    ["The rules apply to you and ____.", "me", ["I", "me", "myself", "mine"], "After the preposition 'to,' use object pronoun."],
    ["The notice was clear, concise, and ____.", "complete", ["completely", "completion", "complete", "completedly"], "Parallel adjectives should be used: clear, concise, complete."]
  ];
  const para = [
    {
      title: "disaster preparedness",
      sentences: ["Local officials first identify flood-prone communities.", "They then prepare evacuation routes and assign response teams.", "After the plan is tested, residents receive public advisories.", "This sequence reduces confusion when heavy rains arrive."],
      intro: "Effective disaster preparedness begins long before a storm enters the country.",
      conclusion: "A practiced plan helps communities respond calmly during emergencies."
    },
    {
      title: "records management",
      sentences: ["Incoming documents are stamped with the date and tracking number.", "The receiving clerk encodes the details in the logbook.", "The papers are forwarded to the proper division for action.", "Completed files are archived according to retention rules."],
      intro: "Orderly records management keeps government transactions traceable.",
      conclusion: "Clear documentation protects both the agency and the citizen."
    },
    {
      title: "public consultation",
      sentences: ["The agency publishes the draft policy for comment.", "Stakeholders submit written suggestions and concerns.", "Officials review the feedback and revise unclear provisions.", "The final policy is issued with an explanation of major changes."],
      intro: "Public consultation improves the quality of government policy.",
      conclusion: "Participation makes rules more responsive and easier to accept."
    },
    {
      title: "employee orientation",
      sentences: ["New employees learn the agency mandate.", "They are briefed on office rules and ethical standards.", "Mentors guide them through common transactions.", "Performance expectations are discussed before regular assignments begin."],
      intro: "A strong orientation helps new public employees serve effectively.",
      conclusion: "Early guidance supports professionalism from the first day of work."
    },
    {
      title: "digital filing",
      sentences: ["Paper documents are scanned using clear file names.", "The files are checked for completeness and readability.", "Authorized personnel upload them to the secure repository.", "Backup copies are created to prevent data loss."],
      intro: "Digital filing can speed up access to official records.",
      conclusion: "Secure electronic records make public service more efficient."
    }
  ];
  const reading = [
    {
      passage: "A city office shortened processing time by mapping each step of permit issuance. Tasks that did not add value were removed, and applicants began receiving text updates. Complaints declined after three months.",
      main: "Process review and communication improved public service.",
      tone: "practical and positive",
      infer: "The office likely measured complaints before and after the change.",
      detail: "Applicants received text updates."
    },
    {
      passage: "When an employee refuses a gift from a supplier, the act may seem small. Yet it protects the fairness of future decisions and shows that public office is not a private advantage.",
      main: "Ethical restraint preserves trust in public decisions.",
      tone: "reflective and principled",
      infer: "Accepting gifts can create a conflict of interest.",
      detail: "The gift came from a supplier."
    },
    {
      passage: "Mangroves protect coastal communities by weakening waves and providing nursery grounds for fish. Removing them for short-term projects can increase disaster risk and reduce livelihood sources.",
      main: "Mangroves support safety and livelihood.",
      tone: "cautionary",
      infer: "Environmental protection can also be economic protection.",
      detail: "Mangroves provide nursery grounds for fish."
    },
    {
      passage: "A reviewer who studies only the easiest topics may feel confident at first. However, actual improvement comes from identifying weak areas and returning to them until errors become rare.",
      main: "Focused practice on weaknesses produces real improvement.",
      tone: "encouraging and direct",
      infer: "Comfortable practice alone can hide readiness gaps.",
      detail: "The reviewer returns to weak areas until errors become rare."
    },
    {
      passage: "The Constitution limits government power by dividing authority among branches and by recognizing rights that officials must respect. These limits are not obstacles to governance; they are safeguards against abuse.",
      main: "Constitutional limits protect the people from abuse of power.",
      tone: "explanatory",
      infer: "Efficient government must still observe legal limits.",
      detail: "Authority is divided among branches."
    }
  ];
  const questions = [];
  for (let i = 0; i < 250; i++) {
    const d = DIFFICULTIES[i % 3];
    const type = i % 5;
    if (type === 0) {
      const v = vocab[mod(i, vocab.length)];
      const askSyn = i % 10 !== 5;
      const answer = askSyn ? v[1] : v[2];
      const lexicalTopic = askSyn ? (i % 4 === 0 ? "Vocabulary" : "Synonyms") : "Antonyms";
      const lexicalPrompt = lexicalTopic === "Vocabulary"
        ? `In the sentence "${v[5]}" what does "${v[0]}" mean?`
        : lexicalTopic === "Synonyms"
          ? `Which word is closest in meaning to "${v[0]}" as used in this sentence: "${v[5]}"?`
          : `Which word is opposite in meaning to "${v[0]}" as used in this sentence: "${v[5]}"?`;
      questions.push(makeQuestion({
        id: uid("VA", i), category: "Verbal Ability", subCategory: lexicalTopic, difficulty: d,
        question: lexicalPrompt,
        choices: askSyn ? [v[1], v[2], v[3], v[4]] : [v[2], v[1], v[3], v[4]],
        answer,
        explanation: `"${v[0]}" means ${v[1]}. In civil service items, use the context of the sentence before choosing a dictionary meaning. ${askSyn ? `Thus the closest meaning is "${v[1]}."` : `The opposite idea is "${v[2]}."`}`,
        hint: `Look for the word that would keep ${askSyn ? "the same" : "an opposite"} meaning in the public-service sentence.`,
        learningTip: "Build vocabulary by writing one official-sounding sentence for each new word."
      }));
    } else if (type === 1) {
      const u = usage[mod(i, usage.length)];
      questions.push(makeQuestion({
        id: uid("VA", i), category: "Verbal Ability", subCategory: "Correct Word Usage", difficulty: d,
        question: `Choose the word that best completes the sentence: ${u[0]}`,
        choices: u[2],
        answer: u[1],
        explanation: `${u[3]} The other choices may be real words, but they do not fit the meaning and grammar of the sentence.`,
        hint: "Read the whole sentence and decide what role the missing word performs.",
        learningTip: "For word usage, eliminate choices that may sound similar but do not match the sentence logic."
      }));
    } else if (type === 2) {
      const g = grammar[mod(i, grammar.length)];
      questions.push(makeQuestion({
        id: uid("VA", i), category: "Verbal Ability", subCategory: ["Grammar and Correct Usage", "Subject-Verb Agreement", "Pronouns", "Tenses", "Parallelism", "Proper Syntax"][mod(i, 6)], difficulty: d,
        question: `Select the grammatically correct word or phrase: ${g[0]}`,
        choices: g[2],
        answer: g[1],
        explanation: `${g[3]} Grammar questions often test the real subject, pronoun case, verb tense, or parallel structure rather than the nearest noun alone.`,
        hint: "Identify the subject and the grammatical pattern before looking at the options.",
        learningTip: "After answering, restate the rule in your own words to make it easier to recognize next time."
      }));
    } else if (type === 3) {
      const p = para[mod(i, para.length)];
      const mode = i % 15;
      const answer = mode < 5 ? p.intro : mode < 10 ? p.sentences.join(" ") : p.conclusion;
      const prompt = mode < 5 ? `Which is the best introductory sentence for a paragraph about ${p.title}?` : mode < 10 ? `Which arrangement creates the most logical paragraph about ${p.title}?` : `Which is the best concluding statement for a paragraph about ${p.title}?`;
      const choices = mode < 5
        ? [p.intro, p.conclusion, p.sentences[1], "The office should always purchase new equipment first."]
        : mode < 10
          ? [p.sentences.join(" "), [p.sentences[2], p.sentences[0], p.sentences[3], p.sentences[1]].join(" "), [p.sentences[3], p.sentences[2], p.sentences[1], p.sentences[0]].join(" "), [p.sentences[1], p.sentences[3], p.sentences[0], p.sentences[2]].join(" ")]
          : [p.conclusion, p.intro, p.sentences[0], "This proves that all delays are unavoidable."];
      questions.push(makeQuestion({
        id: uid("VA", i), category: "Verbal Ability", subCategory: "Paragraph Organization", difficulty: d,
        question: prompt,
        choices,
        answer,
        explanation: `The best choice creates a clear flow: general topic, ordered details, then a closing insight. The correct answer fits the role asked in the question and avoids unsupported or overly broad claims.`,
        hint: "Introductory sentences are broad; concluding sentences summarize or extend the main point.",
        learningTip: "Look for time markers and cause-effect links when arranging sentences."
      }));
    } else {
      const r = reading[mod(i, reading.length)];
      const focus = ["Main idea", "Context clues", "Inference", "Tone", "Supporting details"][mod(i, 5)];
      const answer = focus === "Main idea" ? r.main : focus === "Tone" ? r.tone : focus === "Inference" ? r.infer : focus === "Supporting details" ? r.detail : "meaning can be understood from nearby ideas";
      const choices = [answer, "the passage argues for an unrelated private benefit", "the author rejects all government reform", "the details are mainly decorative and unsupported"];
      questions.push(makeQuestion({
        id: uid("VA", i), category: "Verbal Ability", subCategory: focus === "Main idea" ? "Reading Comprehension" : focus, difficulty: d,
        question: `Read the passage and answer the ${focus.toLowerCase()} item: "${r.passage}"`,
        choices,
        answer,
        explanation: `The passage supports "${answer}" through its stated details and overall direction. Civil service reading items reward evidence-based answers, not personal opinion.`,
        hint: "Underline the repeated idea and check which choice is directly supported.",
        learningTip: "For comprehension, prove your answer by pointing to a phrase in the passage."
      }));
    }
  }
  return questions;
}

function generateAnalytical() {
  const analogies = [
    ["law", "justice", "medicine", "health", "Law aims to promote justice as medicine aims to promote health."],
    ["teacher", "lesson", "judge", "decision", "A teacher gives a lesson; a judge gives a decision."],
    ["budget", "spending", "schedule", "time", "A budget controls spending as a schedule controls time."],
    ["map", "location", "chart", "data", "A map organizes location; a chart organizes data."],
    ["auditor", "accounts", "editor", "manuscript", "An auditor checks accounts as an editor checks a manuscript."],
    ["policy", "implementation", "plan", "execution", "Policy is carried out through implementation as a plan is carried out through execution."],
    ["evidence", "conclusion", "premise", "argument", "Evidence supports a conclusion as a premise supports an argument."],
    ["citizen", "rights", "employee", "duties", "A citizen has rights; an employee has duties."],
    ["archive", "records", "library", "books", "An archive stores records as a library stores books."],
    ["thermometer", "temperature", "barometer", "pressure", "The instrument-measure relationship is parallel."]
  ];
  const syllogisms = [
    { premise: "All accountable officers keep accurate records. Some clerks are accountable officers.", conclusion: "Some clerks keep accurate records.", valid: true },
    { premise: "No confidential files are for public posting. All medical records in the office are confidential files.", conclusion: "No medical records in the office are for public posting.", valid: true },
    { premise: "All online applicants receive tracking numbers. Maria received a tracking number.", conclusion: "Maria is an online applicant.", valid: false },
    { premise: "Some emergency purchases are justified. All justified purchases require documentation.", conclusion: "Some emergency purchases require documentation.", valid: true },
    { premise: "No biased evaluation is acceptable. Some hurried evaluations are biased.", conclusion: "Some hurried evaluations are not acceptable.", valid: true },
    { premise: "All trained responders know the protocol. Carlo knows the protocol.", conclusion: "Carlo is a trained responder.", valid: false },
    { premise: "Every valid ID has a signature. This card has no signature.", conclusion: "This card is not a valid ID.", valid: true },
    { premise: "All completed reports were submitted. Some submitted reports need revision.", conclusion: "Some completed reports need revision.", valid: false }
  ];
  const assumptions = [
    ["The office extended counter hours because many citizens cannot transact during regular work hours.", "Some citizens are available only outside regular work hours."],
    ["The agency moved services online to reduce long queues.", "A number of transactions can be completed without face-to-face processing."],
    ["The reviewer recommends more ratio problems after the learner missed three ratio items.", "Recent errors can indicate a weak topic needing practice."],
    ["The supervisor required written approvals to prevent unauthorized purchases.", "Written approvals make purchases easier to verify."],
    ["The city planted trees along flood-prone streets to reduce heat and runoff.", "Trees can contribute to environmental management in urban areas."],
    ["The committee delayed release of results until all appeals were checked.", "Unchecked appeals could affect fairness or accuracy of results."],
    ["The training used case studies because employees must apply rules to real situations.", "Application is an important part of ethics training."],
    ["The portal asks for contact details so applicants can receive status updates.", "Applicants need a reliable way to be notified about their transactions."]
  ];
  const dataSets = [
    { label: "Permit Applications", rows: [["Jan", 120], ["Feb", 150], ["Mar", 180], ["Apr", 210]], ask: "What is the percentage increase from January to April?", answer: "75%", exp: "Increase is 210 - 120 = 90. Percentage increase is 90 / 120 x 100 = 75%." },
    { label: "Training Attendance", rows: [["Division A", 36], ["Division B", 48], ["Division C", 60], ["Division D", 72]], ask: "Which division has attendance 25% higher than Division B?", answer: "Division C", exp: "25% of 48 is 12, so 48 + 12 = 60, which is Division C." },
    { label: "Complaint Resolution", rows: [["Week 1", 40], ["Week 2", 52], ["Week 3", 50], ["Week 4", 65]], ask: "Which week shows the greatest increase from the previous week?", answer: "Week 2", exp: "Increases are +12, -2, and +15. The greatest increase occurs in Week 4, but from previous week labeling asks the week that shows it; Week 4 is correct." },
    { label: "Budget Use", rows: [["Supplies", 25], ["Training", 30], ["Repairs", 20], ["IT", 25]], ask: "What combined share is for Supplies and IT?", answer: "50%", exp: "Supplies 25% plus IT 25% equals 50%." },
    { label: "Exam Scores", rows: [["Verbal", 82], ["Analytical", 74], ["Numerical", 68], ["General Info", 88]], ask: "Which area is the weakest based on score?", answer: "Numerical", exp: "The lowest score is 68 in Numerical." }
  ];
  const questions = [];
  for (let i = 0; i < 250; i++) {
    const d = DIFFICULTIES[i % 3];
    const type = i % 5;
    if (type === 0) {
      const a = analogies[mod(i, analogies.length)];
      questions.push(makeQuestion({
        id: uid("AA", i), category: "Analytical Ability", subCategory: i % 4 === 0 ? "Analogy" : "Word Association", difficulty: d,
        question: `${a[0].toUpperCase()} is to ${a[1].toUpperCase()} as ${a[2].toUpperCase()} is to _____.`,
        choices: [a[3], a[0], "procedure", "objection"],
        answer: a[3],
        explanation: a[4],
        hint: "Name the relationship in the first pair before testing the second pair.",
        learningTip: "For analogy items, solve the bridge sentence first, then choose the word that completes the same bridge."
      }));
    } else if (type === 1) {
      const s = syllogisms[mod(i, syllogisms.length)];
      questions.push(makeQuestion({
        id: uid("AA", i), category: "Analytical Ability", subCategory: i % 2 ? "Syllogisms" : "Logical Deductions", difficulty: d,
        question: `${s.premise} Which statement best describes this conclusion: "${s.conclusion}"?`,
        choices: s.valid ? ["It follows logically.", "It contradicts both premises.", "It is only a personal opinion.", "It reverses the terms incorrectly."] : ["It does not necessarily follow.", "It follows logically.", "It is directly stated by both premises.", "It is a mathematical certainty."],
        answer: s.valid ? "It follows logically." : "It does not necessarily follow.",
        explanation: s.valid ? "The conclusion is contained within the relationships stated in the premises, so no extra assumption is needed." : "The conclusion commits a common logic error by reversing or overextending the stated relationship.",
        hint: "Check whether the conclusion adds information not guaranteed by the premises.",
        learningTip: "Draw simple circles for all, no, and some statements to avoid being fooled by wording."
      }));
    } else if (type === 2) {
      const a = assumptions[mod(i, assumptions.length)];
      questions.push(makeQuestion({
        id: uid("AA", i), category: "Analytical Ability", subCategory: i % 4 === 0 ? "Hidden Assumptions" : "Assumptions and Conclusions", difficulty: d,
        question: `Statement: ${a[0]} Which assumption is most necessary?`,
        choices: [a[1], "All citizens prefer manual transactions.", "The action has no measurable effect.", "The agency should stop all other services."],
        answer: a[1],
        explanation: `The statement depends on this bridge idea: ${a[1]} Without it, the reason for the action becomes weak or disconnected.`,
        hint: "Ask what must be true for the action to make sense.",
        learningTip: "Necessary assumptions usually connect the evidence to the conclusion."
      }));
    } else if (type === 3) {
      const fallacies = [
        ["The proposal is wrong because the speaker is young.", "Ad hominem", "It attacks the person instead of the proposal."],
        ["One delayed transaction proves the whole agency is inefficient.", "Hasty generalization", "It draws a broad conclusion from too little evidence."],
        ["Either approve this policy today or public service will collapse.", "False dilemma", "It presents only two choices when more may exist."],
        ["This form is correct because we have always used it.", "Appeal to tradition", "Past use alone does not prove present correctness."],
        ["Many people shared the post, so the claim must be true.", "Bandwagon", "Popularity is not proof of truth."]
      ];
      const f = fallacies[mod(i, fallacies.length)];
      questions.push(makeQuestion({
        id: uid("AA", i), category: "Analytical Ability", subCategory: i % 2 ? "Logical Reasoning" : "Identifying Fallacies", difficulty: d,
        question: `Identify the reasoning flaw: "${f[0]}"`,
        choices: [f[1], "Valid deduction", "Cause-and-effect proof", "Statistical sampling"],
        answer: f[1],
        explanation: `${f[2]} In logic questions, the structure of the argument matters more than whether the topic sounds familiar.`,
        hint: "Look for an unfair jump, personal attack, or unsupported either-or framing.",
        learningTip: "Label common fallacies until the pattern becomes automatic."
      }));
    } else {
      const data = dataSets[mod(i, dataSets.length)];
      const table = data.rows.map(([k, v]) => `${k}: ${v}`).join("; ");
      const answer = data.label === "Complaint Resolution" && data.ask.includes("greatest increase") ? "Week 4" : data.answer;
      const choices = [answer, data.rows[0][0], data.rows[1][0], "Cannot be determined"];
      questions.push(makeQuestion({
        id: uid("AA", i), category: "Analytical Ability", subCategory: ["Data Interpretation", "Tables", "Trends", "Percent Interpretation"][mod(i, 4)], difficulty: d,
        question: `${data.label} data: ${table}. ${data.ask}`,
        choices: [...new Set(choices)].slice(0, 4),
        answer,
        explanation: data.label === "Complaint Resolution" ? "Changes are Week 2: +12, Week 3: -2, Week 4: +15. The greatest increase is shown in Week 4." : data.exp,
        hint: "Translate the table into one comparison or computation at a time.",
        learningTip: "For data items, write the required operation before doing arithmetic."
      }));
    }
  }
  return questions;
}

function generateNumerical() {
  const questions = [];
  for (let i = 0; i < 250; i++) {
    const d = DIFFICULTIES[i % 3];
    const type = i % 10;
    let q, choices, answer, explanation, subCategory, hint, learningTip;
    if (type === 0) {
      const a = 48 + i, b = 17 + (i % 9), c = 6 + (i % 5);
      answer = String(a + b * c);
      q = `Compute ${a} + ${b} x ${c}.`;
      choices = [answer, String((a + b) * c), String(a * b + c), String(a + b + c)];
      subCategory = "Basic Operations";
      explanation = `Step 1: Apply MDAS, so multiply first: ${b} x ${c} = ${b * c}. Step 2: Add ${a}: ${a} + ${b * c} = ${answer}. Formula idea: multiplication/division before addition/subtraction. Shortcut: circle multiplication groups first. Wrong answers are wrong because they add before multiplying, multiply the wrong pair, or ignore order of operations.`;
      hint = "Use MDAS before doing any left-to-right addition.";
      learningTip = "When operations are mixed, rewrite the multiplication result above the expression.";
    } else if (type === 1) {
      const n1 = 1 + (i % 5), d1 = 3 + (i % 4), n2 = 2 + (i % 4), d2 = 5 + (i % 5);
      const num = n1 * d2 + n2 * d1, den = d1 * d2;
      answer = `${num}/${den}`;
      q = `Add the fractions ${n1}/${d1} + ${n2}/${d2}.`;
      choices = [answer, `${n1 + n2}/${d1 + d2}`, `${num}/${d1 + d2}`, `${n1 + n2}/${den}`];
      subCategory = "Fractions";
      explanation = `Step 1: Use common denominator ${d1} x ${d2} = ${den}. Step 2: Convert and add numerators: ${n1} x ${d2} + ${n2} x ${d1} = ${num}. Answer: ${num}/${den}. Formula: a/b + c/d = (ad + bc)/bd. Shortcut: cross-multiply then add. Wrong answers add denominators directly or use an incomplete denominator.`;
      hint = "Fractions need a common denominator; do not add denominators directly.";
      learningTip = "For reviewer speed, use cross-products for two simple fractions.";
    } else if (type === 2) {
      const base = 125 + i * 3, rate = [8, 12, 15, 20, 25][i % 5];
      const val = (base * rate) / 100;
      answer = Number.isInteger(val) ? String(val) : val.toFixed(2);
      q = `What is ${rate}% of ${base}?`;
      choices = [answer, String(base + rate), String(base - rate), String((base * (100 + rate)) / 100)];
      subCategory = "Percentages";
      explanation = `Step 1: Convert ${rate}% to ${rate / 100}. Step 2: Multiply ${base} x ${rate / 100} = ${answer}. Formula: part = rate x base. Shortcut: ${rate}% means ${rate} per 100, so divide first when easy. Wrong answers add/subtract the percent number or compute an increased total instead of the part.`;
      hint = "Change percent to decimal, then multiply by the base.";
      learningTip = "Always identify the base before calculating a percentage.";
    } else if (type === 3) {
      const x = 4 + (i % 7), y = 6 + (i % 8), total = x * 3 + y * 2;
      answer = `${x * 3}:${y * 2}`;
      q = `A fund is shared in the ratio 3:2. If one unit is ${x + y} thousand pesos split so that the first share uses ${x} per unit and the second uses ${y} per unit in their computed portions, which expression shows the resulting shares?`;
      choices = [answer, "3:2", `${x + y}:${total}`, `${y * 2}:${x * 3}`];
      subCategory = "Ratio and Proportion";
      explanation = `Step 1: Multiply each ratio part by its assigned unit amount: first share ${3} x ${x} = ${x * 3}; second share ${2} x ${y} = ${y * 2}. Step 2: Compare shares as ${answer}. Formula: share = ratio part x unit value. Shortcut: multiply only the ratio parts that correspond to each share. Wrong answers keep the original ratio, combine all units, or reverse the shares.`;
      hint = "A ratio share is found by multiplying the ratio part by the unit value.";
      learningTip = "Write ratio labels above each part so you do not reverse the answer.";
    } else if (type === 4) {
      const rate = 40 + (i % 6) * 5, time = 2 + (i % 4);
      answer = String(rate * time);
      q = `A service vehicle travels at ${rate} km/h for ${time} hours. How far does it travel?`;
      choices = [answer, String(rate + time), String(rate / time), String(rate * (time + 1))];
      subCategory = "Distance-Rate-Time";
      explanation = `Step 1: Use distance = rate x time. Step 2: ${rate} x ${time} = ${answer} km. Shortcut: if time is a whole number, repeated addition of the rate also works. Wrong answers add rate and time, divide instead of multiply, or use an extra hour not stated.`;
      hint = "Distance equals rate times time.";
      learningTip = "For DRT problems, write the triangle D over R and T to recall D = RT.";
    } else if (type === 5) {
      const now = 24 + (i % 12), gap = 5 + (i % 8), years = 3 + (i % 5);
      answer = String(now + years);
      q = `Ana is ${now} years old. Ben is ${gap} years younger than Ana. How old will Ana be in ${years} years?`;
      choices = [answer, String(now - gap + years), String(now - years), String(gap + years)];
      subCategory = "Age Problems";
      explanation = `Step 1: The question asks Ana's future age, so Ben's age gap is extra information. Step 2: ${now} + ${years} = ${answer}. Formula: future age = present age + years. Shortcut: ignore data that does not answer the asked person. Wrong answers use Ben's age, subtract years, or add the age gap.`;
      hint = "Notice whose age is being asked.";
      learningTip = "In age problems, label each person and the time frame: now, past, or future.";
    } else if (type === 6) {
      const liters = 20 + (i % 8) * 5, pctA = 30, pctB = 60, target = 40;
      const x = (liters * (target - pctA)) / (pctB - target);
      answer = `${x} liters`;
      q = `How many liters of a ${pctB}% solution must be added to ${liters} liters of a ${pctA}% solution to make a ${target}% solution?`;
      choices = [answer, `${liters - x} liters`, `${liters + x} liters`, `${x / 2} liters`];
      subCategory = "Mixture Problems";
      explanation = `Step 1: Let x be liters to add. Pure content equation: ${pctA}%(${liters}) + ${pctB}%(x) = ${target}%(${liters} + x). Step 2: ${0.3 * liters} + 0.60x = ${0.4 * liters} + 0.40x. Step 3: 0.20x = ${0.1 * liters}, so x = ${x}. Formula: old pure + added pure = final pure. Shortcut: alligation gives (${target}-${pctA}):(${pctB}-${target}) = 10:20, so add half of the original. Wrong answers subtract from the original, add total liters, or halve twice.`;
      hint = "Set pure amount before equal to pure amount after mixing.";
      learningTip = "For mixtures, convert percentages to decimals and track pure substance.";
    } else if (type === 7) {
      const a = 6 + (i % 5), b = 8 + (i % 7);
      const combined = (a * b) / (a + b);
      answer = `${combined.toFixed(2)} hours`;
      q = `Worker A can finish a task in ${a} hours and Worker B in ${b} hours. Working together, how long will they take?`;
      choices = [answer, `${a + b} hours`, `${Math.abs(a - b)} hours`, `${Math.min(a, b)} hours`];
      subCategory = "Work Problems";
      explanation = `Step 1: Add work rates: A = 1/${a}, B = 1/${b}. Step 2: Combined rate = 1/${a} + 1/${b} = ${(a + b)}/${a * b}. Step 3: Time = reciprocal = ${a * b}/${a + b} = ${combined.toFixed(2)} hours. Shortcut: for two workers, use ab/(a+b). Wrong answers add times, subtract times, or choose the faster worker's solo time.`;
      hint = "Add rates, not hours.";
      learningTip = "Work problems become easier when one whole job equals 1.";
    } else if (type === 8) {
      const m = 3 + (i % 5), x = 4 + (i % 7), b = 7 + (i % 6), total = m * x + b;
      answer = String(x);
      q = `Solve for x: ${m}x + ${b} = ${total}.`;
      choices = [answer, String(total - b), String(total / m), String(b - m)];
      subCategory = "Basic Algebra";
      explanation = `Step 1: Subtract ${b} from both sides: ${m}x = ${total - b}. Step 2: Divide by ${m}: x = ${total - b}/${m} = ${answer}. Formula: isolate the variable using inverse operations. Shortcut: since ${total} - ${b} is divisible by ${m}, divide after subtracting. Wrong answers stop before division, divide too early, or combine constants incorrectly.`;
      hint = "Undo addition or subtraction first, then undo multiplication.";
      learningTip = "Keep equations balanced by doing the same operation to both sides."
    } else {
      const a = 12 + (i % 10), b = 4 + (i % 6);
      answer = String((a * b) - (a + b));
      q = `Find (${a} x ${b}) - (${a} + ${b}).`;
      choices = [answer, String(a * b + a + b), String(a + b), String(a * (b - a))];
      subCategory = i % 2 ? "Multiplication" : "Subtraction";
      explanation = `Step 1: Compute inside parentheses: ${a} x ${b} = ${a * b}; ${a} + ${b} = ${a + b}. Step 2: Subtract: ${a * b} - ${a + b} = ${answer}. Formula principle: simplify grouped operations first. Shortcut: calculate product and sum separately to reduce mental clutter. Wrong answers add instead of subtract, stop at the sum, or subtract the wrong way.`;
      hint = "Evaluate each parenthesis first.";
      learningTip = "For arithmetic accuracy, separate product, sum, and final operation."
    }
    questions.push(makeQuestion({ id: uid("NA", i), category: "Numerical Ability", subCategory, difficulty: d, question: q, choices: [...new Set(choices)].slice(0, 4), answer, explanation, hint, learningTip }));
  }
  return questions;
}

function generateGeneralInfo() {
  const items = [
    ["Philippine Constitution", "Which principle is reflected when government authority comes from the people?", "Sovereignty resides in the people", ["Sovereignty resides in the people", "Public office is private property", "Only one branch may exercise all powers", "Rights depend only on convenience"], "The Constitution recognizes that sovereignty resides in the people and all government authority emanates from them."],
    ["Bill of Rights", "A citizen is arrested without being informed of the cause of arrest. Which area is most directly involved?", "Rights of persons under custodial investigation", ["Rights of persons under custodial investigation", "Power of taxation", "Local autonomy", "Environmental preference"], "The Bill of Rights protects persons from arbitrary arrest and requires respect for due process."],
    ["Branches of Government", "Which branch primarily interprets laws in actual controversies?", "Judiciary", ["Judiciary", "Executive", "Legislative", "Civil society"], "Courts exercise judicial power by settling actual controversies involving legally demandable rights."],
    ["Checks and Balances", "Congress conducts an inquiry in aid of legislation. What principle is illustrated?", "Checks and balances", ["Checks and balances", "Double compensation", "Nepotism", "Spoils system"], "Legislative inquiry can review implementation and guide lawmaking while respecting constitutional limits."],
    ["RA 6713", "A public official files a truthful SALN within the required period. Which value is promoted?", "Transparency and accountability", ["Transparency and accountability", "Political patronage", "Personal entitlement", "Unrestricted privacy in office"], "RA 6713 promotes accountability through disclosure duties and ethical standards."],
    ["Public Accountability", "An employee uses an office vehicle for a private weekend trip. What is the main issue?", "Misuse of government resources", ["Misuse of government resources", "Academic freedom", "Valid emergency procurement", "Exercise of suffrage"], "Government property must be used for official purposes, not personal benefit."],
    ["Professional Ethics", "A clerk treats a difficult client respectfully despite frustration. Which norm is shown?", "Professionalism", ["Professionalism", "Favoritism", "Delay", "Conflict of interest"], "Professionalism requires courtesy, responsiveness, and restraint in public service."],
    ["Human Dignity", "A service desk creates a priority lane for persons with disabilities and senior citizens. Which value is emphasized?", "Respect for dignity and equal access", ["Respect for dignity and equal access", "Punishment without hearing", "Unfair competition", "Secrecy in procurement"], "Accessible service recognizes that equality may require reasonable accommodation."],
    ["Conflict Resolution", "Two barangays dispute use of a water source. Which first step is most constructive?", "Facilitated dialogue based on facts and needs", ["Facilitated dialogue based on facts and needs", "Immediate public shaming", "Ignoring both parties", "Destroying the water source"], "Conflict resolution begins with communication, facts, and mutually acceptable options."],
    ["Environmental Management", "An office separates biodegradable, recyclable, and residual waste. Which practice is shown?", "Waste segregation", ["Waste segregation", "Red-tagging", "Vote buying", "Double taxation"], "Waste segregation supports environmental management and proper disposal."],
    ["Climate Change", "A municipality updates drainage and hazard maps because rainfall is becoming more intense. What issue is addressed?", "Climate adaptation", ["Climate adaptation", "Censorship", "Unemployment insurance", "Judicial review"], "Adaptation means adjusting systems to reduce harm from climate-related risks."],
    ["Environmental Laws", "A factory must secure permits before discharging wastewater. What is the purpose?", "Prevent pollution and protect public health", ["Prevent pollution and protect public health", "Remove all business taxes", "Avoid labor standards", "Replace local elections"], "Environmental regulation manages activities that can harm ecosystems and communities."],
    ["Social Justice", "A livelihood program prioritizes marginalized communities. Which constitutional value is supported?", "Social justice", ["Social justice", "Bill of attainder", "Absolute immunity", "Private monopoly"], "Social justice seeks a more equitable distribution of opportunities and protection."],
    ["Equality", "Applicants are assessed using the same published criteria. Which principle is served?", "Equal protection and fairness", ["Equal protection and fairness", "Secret preference", "Hereditary office", "Arbitrary classification"], "Equal protection requires similar treatment for similarly situated persons."],
    ["Sustainability", "A project meets present needs while preserving resources for future generations. What concept is this?", "Sustainable development", ["Sustainable development", "Wasteful extraction", "Short-term patronage", "Administrative secrecy"], "Sustainable development balances economic, social, and environmental needs."]
  ];
  const questions = [];
  for (let i = 0; i < 250; i++) {
    const it = items[mod(i, items.length)];
    questions.push(makeQuestion({
      id: uid("GI", i),
      category: "General Information",
      subCategory: it[0],
      difficulty: DIFFICULTIES[i % 3],
      question: it[1],
      choices: it[3],
      answer: it[2],
      explanation: `${it[4]} This is a practical reviewer-style item because professional-level questions often ask how a rule appears in a workplace or community situation.`,
      hint: "Identify the public value or legal principle being tested by the situation.",
      learningTip: "Connect every legal concept to one concrete government-service example."
    }));
  }
  return questions;
}

function generateSupplementalCoverage() {
  const offices = ["municipal office", "records unit", "health center", "budget division", "regional desk", "procurement team", "training unit", "environment office", "barangay hall", "licensing section", "public assistance desk", "audit team", "planning office", "HR unit", "disaster office", "engineering desk", "treasury unit", "legal office", "information desk", "field office"];
  const completion = [
    ["The office released a ____ advisory to prevent confusion among applicants.", "clear", ["clear", "cloudy", "careless", "private"]],
    ["The employee gave a ____ explanation of the new filing procedure.", "concise", ["concise", "noisy", "fragile", "temporary"]],
    ["The agency must remain ____ when evaluating bidders.", "impartial", ["impartial", "impatient", "informal", "isolated"]],
    ["Citizens appreciate service that is prompt and ____.", "courteous", ["courteous", "expensive", "distant", "optional"]],
    ["The committee found the proposal ____ because funds and staff were available.", "feasible", ["feasible", "fictional", "careless", "hostile"]],
    ["The clerk checked the entries to ensure the report was ____.", "accurate", ["accurate", "decorative", "ancient", "private"]],
    ["The supervisor asked for a ____ summary instead of a lengthy narrative.", "brief", ["brief", "bitter", "broken", "biased"]],
    ["The office adopted a ____ system for tracking complaints.", "reliable", ["reliable", "reckless", "random", "remote"]],
    ["The rules should be applied in a ____ manner to all applicants.", "consistent", ["consistent", "confusing", "careless", "costly"]],
    ["The new portal made frontline services more ____ to citizens.", "accessible", ["accessible", "accidental", "aggressive", "artificial"]]
  ];
  const vocabWords = [["diligent", "hardworking", "negligent", "persistent", "attentive"], ["prudent", "careful", "reckless", "wise", "cautious"], ["transparent", "open", "secretive", "clear", "visible"], ["accountable", "answerable", "unaccountable", "responsible", "liable"], ["meticulous", "precise", "careless", "thorough", "detailed"], ["resilient", "adaptable", "fragile", "steady", "strong"], ["obsolete", "outdated", "current", "old", "unused"], ["coherent", "logical", "confusing", "organized", "consistent"], ["relevant", "connected", "irrelevant", "related", "applicable"], ["ethical", "honest", "improper", "moral", "principled"]];
  const currentEventItems = [
    ["A national agency issues an official advisory during a public health concern. Which source should a citizen rely on first?", "the official government advisory", ["viral reposts without source", "anonymous group chats", "unverified commentary"], "Current-events awareness requires checking official and verifiable public information."],
    ["A typhoon affects several provinces and local governments activate evacuation centers. Which issue is most directly involved?", "disaster risk reduction and public safety", ["private entertainment policy", "foreign currency trading only", "sports regulation"], "Major disaster response is a recurring civic-awareness and public-service current event topic."],
    ["The government launches an online service portal for faster transactions. Which public-service concern does this address?", "digitalization of government services", ["abolition of due process", "private ownership of public records", "removal of citizen feedback"], "Government digitalization is a national development issue tied to frontline service."],
    ["A transport modernization update is reported by official agencies. What should examinees focus on?", "public impact, implementation, and affected sectors", ["celebrity opinion only", "rumors about unrelated offices", "the longest social media thread"], "Current-events questions test civic impact, not gossip or unsupported claims."],
    ["A new government program targets food security and local agriculture. Which national issue is most related?", "food supply and economic resilience", ["grammar correction", "office furniture layout", "private party preference"], "Food security is a national development and public welfare issue."],
    ["A cybersecurity warning is released after reports of online scams. Which public concern is highlighted?", "digital safety and citizen protection", ["manual filing style", "road width measurement", "literary tone"], "Cybersecurity has become a significant public-service and citizen-awareness issue."],
    ["A Senate or House hearing is covered in national news. Which concept helps citizens understand its purpose?", "legislative oversight and inquiry", ["judicial sentencing by reporters", "private bidding without rules", "weather forecasting"], "Government proceedings are current events when they affect policy, accountability, or public funds."],
    ["An inflation update is released by the statistics authority. What is the best civic interpretation?", "it indicates changes in prices affecting households", ["it is a grammar rule", "it proves all agencies are private", "it replaces the Constitution"], "Economic indicators are current-events topics because they affect citizens and government planning."]
  ];
  const questions = [];
  const push = (category, subCategory, i, question, choices, answer, explanation, hint = "Eliminate choices that do not match the rule or facts.") => {
    questions.push(makeQuestion({
      id: uid(`SP${category.split(" ")[0][0]}${subCategory.split(" ")[0][0]}`, questions.length),
      category,
      subCategory,
      difficulty: DIFFICULTIES[i % 3],
      question,
      choices,
      answer,
      explanation: `${explanation} Step-by-step: identify the clue, apply the rule, eliminate mismatches, and verify the answer. Common mistake: choosing a familiar word or operation without checking the exact question. Exam strategy: answer from evidence, not pattern. Memory aid: rule first, choice second.`,
      hint,
      learningTip: `Review one missed ${subCategory} item, then solve two similar but differently worded items.`
    }));
  };
  CATEGORIES.forEach((cat) => {
    cat.subs.forEach((topic) => {
      for (let i = 0; i < 40; i++) {
        const office = offices[i % offices.length];
        if (cat.name === "Verbal Ability") {
          if (topic === "Sentence Completion") {
            const item = completion[i % completion.length];
            push(cat.name, topic, i, `${item[0]} (${office})`, item[2], item[1], `The sentence needs "${item[1]}" because it fits both the meaning and formal tone.`);
          } else if (topic === "Vocabulary" || topic === "Synonyms" || topic === "Antonyms") {
            const [word, meaning, antonym, nearOne, nearTwo] = vocabWords[i % vocabWords.length];
            const answer = topic === "Antonyms" ? antonym : meaning;
            const prompt = topic === "Antonyms" ? `What is the best antonym of "${word}" in formal usage?` : topic === "Synonyms" ? `Which synonym best matches "${word}" in a ${office} report?` : `In a ${office} report, what is the best meaning of "${word}"?`;
            push(cat.name, topic, i, prompt, [answer, nearOne, nearTwo, topic === "Antonyms" ? meaning : antonym], answer, `"${word}" is used in formal reviewer contexts to mean ${meaning}.`);
          } else if (topic === "Grammar and Correct Usage") {
            const subject = ["list", "committee", "employee", "set of forms", "schedule"][i % 5];
            const answer = `The ${subject} is ready for release.`;
            push(cat.name, topic, i, `Which sentence uses correct subject-verb agreement for the ${office}?`, [answer, `The ${subject} are ready for release.`, `The ${subject} were ready tomorrow.`, `The ${subject} have ready for release.`], answer, `The singular subject "${subject}" requires the singular verb "is."`);
          } else if (topic === "Reading Comprehension") {
            const answer = "The office improved service by removing unnecessary steps.";
            push(cat.name, topic, i, `Passage: The ${office} reviewed its process, removed duplicate signatures, and sent applicants status updates. Complaints decreased after two months. What is the main idea?`, [answer, "The office stopped serving applicants.", "Complaints increased because of duplicate signatures.", "Status updates are unrelated to service quality."], answer, "The details all support process improvement and better communication.");
          } else if (topic === "Paragraph Organization") {
            const answer = "Identify the problem. Review the process. Remove delays. Inform citizens of the improved procedure.";
            push(cat.name, topic, i, `Which arrangement creates the clearest paragraph about improving ${office} service?`, [answer, "Inform citizens. Remove delays. Identify the problem. Review the process.", "Remove delays. Identify the problem. Inform citizens. Review the process.", "Review the process. Inform citizens. Identify the problem. Remove delays."], answer, "The correct order moves from problem identification to action and public communication.");
          } else {
            const answer = "The conclusion follows only if the facts directly support it.";
            push(cat.name, topic, i, `A memo says the ${office} reduced processing time after adding online tracking. Which verbal reasoning rule should be applied?`, [answer, "Any popular claim is automatically correct.", "A conclusion may ignore the stated facts.", "The longest option is usually the safest."], answer, "Verbal reasoning requires a conclusion supported by the passage, not outside assumptions.");
          }
        } else if (cat.name === "Numerical Ability") {
          const a = 20 + i, b = 5 + (i % 9), rate = 5 + (i % 8) * 5;
          if (topic === "Percentages") {
            const answer = `${Math.round((b / a) * 100)}%`;
            push(cat.name, topic, i, `${b} resolved requests are what percent of ${a} total requests in the ${office}?`, [answer, `${a - b}%`, `${a + b}%`, `${rate}%`], answer, `Formula: percentage = part / whole x 100. Compute ${b} / ${a} x 100.`);
          } else if (topic === "Fractions") {
            const answer = `${a + b}/${a * 2}`;
            push(cat.name, topic, i, `Add ${a}/${a * 2} and ${b}/${a * 2} from two report batches.`, [answer, `${a + b}/${a}`, `${a * b}/${a * 2}`, `${a - b}/${a * 2}`], answer, "Same denominators are added by adding numerators and keeping the denominator.");
          } else if (topic === "Ratios and Proportions") {
            const answer = `${b * 3}:${b * 2}`;
            push(cat.name, topic, i, `A supply fund is divided in the ratio 3:2 with ${b} units per part. What are the shares?`, [answer, "3:2", `${b * 5}:${b}`, `${b * 2}:${b * 3}`], answer, "Multiply each ratio part by the unit value.");
          } else if (topic === "Profit and Loss") {
            const cost = 500 + i * 10, sell = cost + rate * 10, answer = `${sell - cost} pesos`;
            push(cat.name, topic, i, `An item costs ${cost} pesos and is sold for ${sell} pesos. What is the profit?`, [answer, `${sell + cost} pesos`, `${cost - sell} pesos`, `${rate}%`], answer, "Profit = selling price - cost.");
          } else if (topic === "Discounts") {
            const price = 1000 + i * 20, discount = Math.round(price * rate / 100), answer = `${price - discount} pesos`;
            push(cat.name, topic, i, `A ${price}-peso item has a ${rate}% discount. What is the sale price?`, [answer, `${discount} pesos`, `${price + discount} pesos`, `${price - rate} pesos`], answer, "Discount = rate x price; sale price = price - discount.");
          } else if (topic === "Number Series") {
            const start = 2 + (i % 5), step = 3 + (i % 4), answer = String(start + step * 4);
            push(cat.name, topic, i, `Find the next number: ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, __`, [answer, String(start + step * 5), String(start * step), String(step)], answer, `The pattern adds ${step} each time.`);
          } else if (topic === "Simple Interest") {
            const p = 1000 + i * 100, r = 0.05, t = 2 + (i % 3), answer = `${p * r * t} pesos`;
            push(cat.name, topic, i, `Find simple interest on ${p} pesos at 5% for ${t} years.`, [answer, `${p + p * r * t} pesos`, `${p * r} pesos`, `${p / t} pesos`], answer, "Use I = PRT, with rate written as decimal.");
          } else {
            const answer = String(a + b * 2);
            push(cat.name, topic, i, `The ${office} processed ${a} forms in the morning and twice ${b} in the afternoon. How many forms were processed?`, [answer, String((a + b) * 2), String(a - b), String(a * b)], answer, "Multiply before adding because the afternoon count is twice the given number.");
          }
        } else if (cat.name === "Analytical Ability") {
          if (topic === "Analogy") {
            const answer = "court : decision";
            push(cat.name, topic, i, `Complete the analogy: office : memorandum :: ____`, [answer, "tree : document", "river : salary", "chair : policy"], answer, "An office issues a memorandum as a court issues a decision.");
          } else if (topic === "Data Interpretation") {
            const jan = 40 + i, feb = jan + 10, answer = `${feb - jan}`;
            push(cat.name, topic, i, `The ${office} handled ${jan} cases in January and ${feb} in February. What is the increase?`, [answer, String(feb + jan), String(jan - feb), `${10}%`], answer, "Increase equals new value minus old value.");
          } else if (topic === "Pattern Recognition") {
            const answer = "Every step adds one more required document.";
            push(cat.name, topic, i, `A process asks for 1 ID, then 2 forms, then 3 signatures, then 4 attachments. What pattern is shown?`, [answer, "The numbers are all doubled.", "The sequence decreases.", "The pattern is alphabetical."], answer, "The required count increases by one each step.");
          } else {
            const answer = "It follows only if the stated premise guarantees it.";
            push(cat.name, topic, i, `All approved vouchers have complete documents. One voucher lacks complete documents. What reasoning rule applies?`, [answer, "Reverse the premise automatically.", "Assume it is approved because it is a voucher.", "Ignore the condition stated."], answer, "Logic items require checking whether a conclusion is guaranteed by the premise.");
          }
        } else if (topic === "Current Events") {
          const item = currentEventItems[i % currentEventItems.length];
          push(cat.name, topic, i, item[0], [item[1], ...item[2]], item[1], item[3], "Choose the option tied to verified national issues, government action, or public-service impact.");
        } else {
          const answer = topic === "Government Structure" ? "separation of powers" : topic === "Current Events" ? "evidence-based public response" : topic;
          push(cat.name, topic, i, `A ${office} situation requires applying ${topic}. Which principle is most relevant?`, [answer, "private advantage over public duty", "unverified rumor as policy basis", "arbitrary treatment without standards"], answer, `${topic} questions test practical application of public-service rules and civic values.`);
        }
      }
    });
  });
  return questions;
}

const QUESTION_BANK = [];

const initialProgress = {
  xp: 0,
  streak: 1,
  answered: {},
  drillMastery: {},
  bookmarks: {},
  imports: [],
  aiDrafts: [],
  aiLessons: [],
  account: null,
  sessions: [],
  onboardingComplete: false,
  mockQuestionIds: {},
  recentQuestionIds: [],
  lastStudyDate: new Date().toISOString().slice(0, 10)
};

function loadProgress() {
  return initialProgress;
}

function getRankInfo(stats, progress, readiness) {
  const sessions = progress.sessions || [];
  const masteryTests = sessions.filter((s) => s.mode === "Mastery Test");
  const mockExams = sessions.filter((s) => s.mode?.includes("Mock"));
  const masteryScore = masteryTests.length ? Math.round(masteryTests.reduce((sum, s) => sum + (s.accuracy || 0), 0) / masteryTests.length) : 0;
  const mockScore = mockExams.length ? Math.round(mockExams.reduce((sum, s) => sum + (s.accuracy || 0), 0) / mockExams.length) : 0;
  const answeredScore = Math.min(100, Math.round((stats.total / 300) * 100));
  const score = Math.round((stats.accuracy * 0.35) + (answeredScore * 0.2) + (masteryScore * 0.15) + (mockScore * 0.15) + (readiness.score * 0.15));
  const currentIndex = rankLevels.reduce((idx, rank, i) => (score >= rank.threshold ? i : idx), 0);
  const current = rankLevels[currentIndex];
  const next = rankLevels[currentIndex + 1] || null;
  const previousThreshold = current.threshold;
  const nextThreshold = next?.threshold ?? 100;
  const progressToNext = next ? Math.min(100, Math.round(((score - previousThreshold) / (nextThreshold - previousThreshold)) * 100)) : 100;
  return { score, current: current.name, next: next?.name || "Top rank", progressToNext, formula: { accuracy: stats.accuracy, answeredScore, masteryScore, mockScore, readinessScore: readiness.score } };
}

function normalizeDbQuestion(row) {
  if (!row) return null;
  const choices = Array.isArray(row.choices) ? row.choices : [];
  return makeQuestion({
    id: row.id,
    category: row.category,
    subCategory: row.sub_category || row.subCategory,
    difficulty: row.difficulty || "Medium",
    question: row.question,
    choices,
    answer: row.answer,
    explanation: row.explanation,
    hint: row.hint || "Eliminate choices that do not match the tested rule.",
    learningTip: row.learning_tip || row.learningTip || "Review the rule, then answer a similar item without looking at the explanation."
  });
}

function variantQuestion(base, variantIndex) {
  const contexts = ["records audit", "frontline service", "permit processing", "budget review", "community program", "procurement check", "citizen complaint", "HR screening", "environmental report", "public assistance"];
  const focuses = ["official records", "citizen documents", "agency guidelines", "service standards", "review findings", "frontline procedures", "public advisories", "compliance checks", "community reports", "office transactions", "case notes", "program updates"];
  const details = ["before final release", "after supervisor review", "during compliance checking", "while preparing a summary", "after comparing supporting files", "during a public-service evaluation", "before encoding the result", "while resolving a citizen concern", "after checking the official basis", "during quality review", "while preparing the recommendation", "after validating the submitted details", "during a follow-up review", "before forwarding the action", "while checking the official record", "after identifying the main issue"];
  const angles = ["for a routine request", "for an urgent request", "for a first-time applicant", "for a returning client", "for a multi-office transaction", "for an incomplete submission", "for a verified complaint", "for a documented appeal", "for a community inquiry", "for an internal review", "for a policy update", "for a service-delay report", "for a citizen feedback form", "for an audit observation", "for a public advisory", "for a digital filing concern", "for a records correction", "for a compliance reminder", "for a frontline service report"];
  const context = contexts[variantIndex % contexts.length];
  const focus = focuses[variantIndex % focuses.length];
  const detail = details[variantIndex % details.length];
  const angle = angles[variantIndex % angles.length];
  const difficulty = DIFFICULTIES[(DIFFICULTIES.indexOf(base.difficulty) + variantIndex) % DIFFICULTIES.length] || base.difficulty;
  const variantId = `${base.id}-V${variantIndex}`;
  const baseText = cleanQuestionText(base.question).replace(/^In an? [a-z ]+ scenario,\s*/i, "");
  return makeQuestion({
    ...base,
    id: variantId,
    difficulty,
    question: `In a ${context} scenario involving ${focus} ${detail} ${angle}, ${baseText}`,
    choices: base.category === "Numerical Ability" ? [base.answer, ...numericVariantDistractors(base.answer, variantIndex)] : [base.answer, ...plausibleDistractors(base.category, base.subCategory, base.answer, variantId).slice(0, 5)],
    answer: base.answer,
    explanation: `${base.explanation} This variation uses a different ${context} context, but the same tested concept applies.`,
    hint: base.hint,
    learningTip: `${base.learningTip} Practice the same concept across changed wording so you recognize the rule, not the memorized item.`
  });
}

function expandQuestionPool(bank, minimumPerSub = 360) {
  const uniqueBank = [];
  const initialSeen = new Set();
  bank.forEach((q) => {
    const key = `${q.category}|${q.subCategory}|${questionSignature(q)}`;
    if (!initialSeen.has(key)) {
      uniqueBank.push(q);
      initialSeen.add(key);
    }
  });
  const expanded = [...uniqueBank];
  const grouped = {};
  expanded.forEach((q) => {
    const key = `${q.category}|${q.subCategory}`;
    (grouped[key] ||= []).push(q);
  });
  CATEGORIES.forEach((cat) => cat.subs.forEach((sub) => {
    const key = `${cat.name}|${sub}`;
    const source = [...(grouped[key] || [])];
    let variantIndex = 1;
    const seenQuestions = new Set((grouped[key] || []).map(questionSignature));
    let attempts = 0;
    while (source.length && seenQuestions.size < minimumPerSub && attempts < minimumPerSub * 30) {
      const next = variantQuestion(source[(variantIndex - 1) % source.length], variantIndex);
      const nextSignature = questionSignature(next);
      if (!seenQuestions.has(nextSignature)) {
        expanded.push(next);
        (grouped[key] ||= []).push(next);
        seenQuestions.add(nextSignature);
      }
      variantIndex += 1;
      attempts += 1;
    }
  }));
  return expanded;
}

function analyze(progress, bank = QUESTION_BANK) {
  const records = Object.values(progress.answered || {});
  const byCategory = {};
  const bySub = {};
  for (const cat of CATEGORIES) byCategory[cat.name] = { total: 0, correct: 0, wrong: 0, skipped: 0, time: 0 };
  records.forEach((r) => {
    const cat = byCategory[r.category] || (byCategory[r.category] = { total: 0, correct: 0, wrong: 0, skipped: 0, time: 0 });
    cat.total += 1; cat.correct += r.status === "correct" ? 1 : 0; cat.wrong += r.status === "wrong" ? 1 : 0; cat.skipped += r.status === "skipped" ? 1 : 0; cat.time += r.time || 0;
    const sub = bySub[r.subCategory] || (bySub[r.subCategory] = { total: 0, correct: 0, wrong: 0, skipped: 0, time: 0, category: r.category });
    sub.total += 1; sub.correct += r.status === "correct" ? 1 : 0; sub.wrong += r.status === "wrong" ? 1 : 0; sub.skipped += r.status === "skipped" ? 1 : 0; sub.time += r.time || 0;
  });
  const categoryStats = Object.entries(byCategory).map(([name, s]) => ({ name, ...s, accuracy: pct(s.correct, s.total), completion: pct(s.total, bank.filter((q) => q.category === name).length), avgTime: s.total ? Math.round(s.time / s.total) : 0 }));
  const subStats = Object.entries(bySub).map(([name, s]) => ({ name, ...s, accuracy: pct(s.correct, s.total), avgTime: s.total ? Math.round(s.time / s.total) : 0 }));
  const weakest = subStats.filter((s) => s.total).sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong)[0];
  const strongest = subStats.filter((s) => s.total >= 2).sort((a, b) => b.accuracy - a.accuracy || b.total - a.total)[0];
  const total = records.length;
  const correct = records.filter((r) => r.status === "correct").length;
  return {
    total, correct,
    wrong: records.filter((r) => r.status === "wrong").length,
    skipped: records.filter((r) => r.status === "skipped").length,
    accuracy: pct(correct, total),
    progress: pct(total, bank.length),
    categoryStats,
    subStats,
    weakest,
    strongest,
    avgTime: total ? Math.round(records.reduce((sum, r) => sum + (r.time || 0), 0) / total) : 0
  };
}

function buildQuestionBank(progress, cloudRows = []) {
  const cloudQuestions = (cloudRows || []).filter((row) => !row.status || row.status === "Approved").map(normalizeDbQuestion).filter(Boolean);
  return [...QUESTION_BANK, ...cloudQuestions];
}

function questionSignature(q) {
  return q.question
    .replace(/^Item\s+[A-Z0-9-]+:\s*/i, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function answerSetSignature(q) {
  return q.choices.map((choice) => choice.toLowerCase().replace(/\s+/g, " ").trim()).sort().join("|");
}

function uniqueSessionQuestions(pool, count, progress, seed) {
  const answered = progress.answered || {};
  const recent = new Set(progress.recentQuestionIds || []);
  const ordered = seededShuffle(pool, seed).sort((a, b) => {
    const aSeen = answered[a.id] ? 1 : 0;
    const bSeen = answered[b.id] ? 1 : 0;
    const aRecent = recent.has(a.id) ? 1 : 0;
    const bRecent = recent.has(b.id) ? 1 : 0;
    return aRecent - bRecent || aSeen - bSeen;
  });
  const picked = [];
  const seenQuestion = new Set();
  const seenAnswers = new Set();
  for (const q of ordered) {
    const qSig = questionSignature(q);
    const aSig = answerSetSignature(q);
    if (seenQuestion.has(qSig) || seenAnswers.has(aSig)) continue;
    picked.push(q);
    seenQuestion.add(qSig);
    seenAnswers.add(aSig);
    if (picked.length === count) return picked;
  }
  for (const q of ordered) {
    if (picked.some((item) => item.id === q.id)) continue;
    const qSig = questionSignature(q);
    const aSig = answerSetSignature(q);
    if (seenQuestion.has(qSig) || seenAnswers.has(aSig)) continue;
    picked.push(q);
    seenQuestion.add(qSig);
    seenAnswers.add(aSig);
    if (picked.length === count) return picked;
  }
  return picked;
}

function mergeUniqueQuestions(initial, candidates, count, seed) {
  const result = [];
  const seenIds = new Set();
  const seenQuestion = new Set();
  const seenAnswers = new Set();
  const addStrict = (q) => {
    if (!q || seenIds.has(q.id) || result.length >= count) return;
    const qSig = questionSignature(q);
    const aSig = answerSetSignature(q);
    if (seenQuestion.has(qSig) || seenAnswers.has(aSig)) return;
    result.push(q);
    seenIds.add(q.id);
    seenQuestion.add(qSig);
    seenAnswers.add(aSig);
  };
  initial.forEach(addStrict);
  seededShuffle(candidates, seed).forEach(addStrict);
  return result;
}

function withBalancedAnswerPositions(questions, seed) {
  const counts = [0, 0, 0, 0];
  return questions.map((q, index) => {
    const rankedSlots = [0, 1, 2, 3].sort((a, b) => counts[a] - counts[b] || hashText(`${seed}-${q.id}-${index}-${a}`) - hashText(`${seed}-${q.id}-${index}-${b}`));
    const answerIndex = rankedSlots[0];
    counts[answerIndex] += 1;
    const distractors = seededShuffle(q.choices.filter((choice) => choice !== q.answer), `${seed}-${q.id}-distractors`);
    const choices = [];
    let distractorIndex = 0;
    for (let slot = 0; slot < 4; slot++) choices.push(slot === answerIndex ? q.answer : distractors[distractorIndex++]);
    return { ...q, choices };
  });
}

function difficultyTargets(count, mode = "") {
  const mockNumber = mockExamNumber(mode);
  const hardRatio = mockNumber ? Math.min(0.3, 0.14 + mockNumber * 0.016) : 0.2;
  const easyRatio = mockNumber ? Math.max(0.2, 0.38 - mockNumber * 0.018) : 0.3;
  const easy = Math.round(count * easyRatio);
  const hard = Math.round(count * hardRatio);
  return { Easy: easy, Medium: Math.max(0, count - easy - hard), Hard: hard };
}

function balancedDifficultyQuestions(pool, count, progress, seed, mode = "") {
  const targets = difficultyTargets(count, mode);
  const parts = [
    uniqueSessionQuestions(pool.filter((q) => q.difficulty === "Easy"), targets.Easy, progress, `${seed}-easy`),
    uniqueSessionQuestions(pool.filter((q) => q.difficulty === "Medium"), targets.Medium, progress, `${seed}-medium`),
    uniqueSessionQuestions(pool.filter((q) => q.difficulty === "Hard"), targets.Hard, progress, `${seed}-hard`)
  ].flat();
  return mergeUniqueQuestions(parts, pool, count, `${seed}-fill`);
}

function balancedMockQuestions(bank, mode, progress, count) {
  const categoryTargets = CATEGORIES.map((cat, idx) => ({ cat, count: mode === "Full Mock Exam" ? (idx === 3 ? 35 : 45) : Math.floor(count / CATEGORIES.length) + (idx < count % CATEGORIES.length ? 1 : 0) }));
  const picked = [];
  categoryTargets.forEach(({ cat, count: catCount }) => {
    const perDifficulty = difficultyTargets(catCount, mode);
    const catPool = bank.filter((q) => q.category === cat.name);
    if (mode === "Full Mock Exam") {
      picked.push(...balancedCategoryQuestions(catPool, mode, progress, catCount));
      return;
    }
    const parts = [
      uniqueSessionQuestions(catPool.filter((q) => q.difficulty === "Easy"), perDifficulty.Easy, progress, `${mode}-${cat.name}-easy-${Date.now()}`),
      uniqueSessionQuestions(catPool.filter((q) => q.difficulty === "Medium"), perDifficulty.Medium, progress, `${mode}-${cat.name}-medium-${Date.now()}`),
      uniqueSessionQuestions(catPool.filter((q) => q.difficulty === "Hard"), perDifficulty.Hard, progress, `${mode}-${cat.name}-hard-${Date.now()}`)
    ].flat();
    picked.push(...mergeUniqueQuestions(parts, catPool, catCount, `${mode}-${cat.name}-balance-${Date.now()}`));
  });
  let result = mergeUniqueQuestions([], picked, count, `${mode}-final-${Date.now()}`);
  categoryTargets.forEach(({ cat, count: catCount }) => {
    const current = result.filter((q) => q.category === cat.name).length;
    if (current < catCount) result = mergeUniqueQuestions(result, bank.filter((q) => q.category === cat.name), Math.min(count, result.length + catCount - current), `${mode}-${cat.name}-deficit-${Date.now()}`);
  });
  return mergeUniqueQuestions(result, bank, count, `${mode}-final-fill-${Date.now()}`);
}

function balancedCategoryQuestions(pool, mode, progress, count) {
  const subCategories = [...new Set(pool.map((q) => q.subCategory))];
  const picked = [];
  subCategories.forEach((sub, idx) => {
    const target = Math.floor(count / subCategories.length) + (idx < count % subCategories.length ? 1 : 0);
    const subPool = pool.filter((q) => q.subCategory === sub);
    const targets = difficultyTargets(target, mode);
    const parts = [
      uniqueSessionQuestions(subPool.filter((q) => q.difficulty === "Easy"), targets.Easy, progress, `${mode}-${sub}-easy-${Date.now()}`),
      uniqueSessionQuestions(subPool.filter((q) => q.difficulty === "Medium"), targets.Medium, progress, `${mode}-${sub}-medium-${Date.now()}`),
      uniqueSessionQuestions(subPool.filter((q) => q.difficulty === "Hard"), targets.Hard, progress, `${mode}-${sub}-hard-${Date.now()}`)
    ].flat();
    picked.push(...mergeUniqueQuestions(parts, subPool, target, `${mode}-${sub}-balance-${Date.now()}`));
  });
  return mergeUniqueQuestions([], picked, count, `${mode}-category-final-${Date.now()}`);
}

function selectQuestions(category, mode, progress, subCategory = "All Topics", bankOverride = null) {
  const bank = bankOverride || buildQuestionBank(progress);
  let pool = bank.filter((q) => (category === "All Categories" || q.category === category) && (subCategory === "All Topics" || q.subCategory === subCategory));
  const isTopicLevel = subCategory !== "All Topics";
  const isCategoryLevel = category !== "All Categories" && subCategory === "All Topics";
  const mockNumber = mockExamNumber(mode);
  if (mockNumber) {
    const usedMockIds = new Set(progress.mockQuestionIds?.[mockHistoryKey(category, subCategory)] || []);
    pool = pool.filter((q) => !usedMockIds.has(q.id));
  }
  if (mode === "Full Mock Exam") {
    return withBalancedAnswerPositions(balancedMockQuestions(bank, mode, progress, 170), `${mode}-${Date.now()}`);
  }
  if (mode === "Wrong Drill") {
    const wrongIds = Object.entries(progress.answered || {})
      .filter(([, r]) => r.status === "wrong" || r.status === "skipped")
      .map(([id]) => id);
    const drillPool = bank.filter((q) => wrongIds.includes(q.id) && (progress.drillMastery?.[q.id] || 0) < 3 && (category === "All Categories" || q.category === category) && (subCategory === "All Topics" || q.subCategory === subCategory));
    pool = drillPool.length ? drillPool : pool.filter((q) => q.difficulty !== "Easy");
  }
  if (mode === "Mastery") {
    const stats = analyze(progress);
    const weakSubs = stats.subStats.filter((s) => s.accuracy < 70 || s.wrong > s.correct).map((s) => s.name);
    const weakIds = Object.entries(progress.answered || {}).filter(([, r]) => r.status !== "correct").map(([id]) => id);
    const weakPool = pool.filter((q) => weakSubs.includes(q.subCategory) || weakIds.includes(q.id));
    pool = weakPool.length >= 8 ? weakPool : pool.filter((q) => q.difficulty !== "Easy").concat(weakPool);
  }
  const count = isTopicLevel ? 25 : isCategoryLevel ? 170 : mode === "Quick Review" ? 10 : mode === "Mini Quiz" ? 20 : mockNumber ? Math.min(170, 50 + (mockNumber - 1) * 12) : mode === "Timed Exam" ? 60 : mode === "Wrong Drill" ? 30 : mode === "Mastery Test" ? 50 : 25;
  if (mockNumber) {
    if (category === "All Categories") {
      const usedMockIds = new Set(progress.mockQuestionIds?.[mockHistoryKey(category, subCategory)] || []);
      const mockBank = bank.filter((q) => !usedMockIds.has(q.id));
      return withBalancedAnswerPositions(balancedMockQuestions(mockBank, mode, progress, count), `${mode}-all-${Date.now()}`);
    }
    if (subCategory === "All Topics") return withBalancedAnswerPositions(balancedCategoryQuestions(pool, mode, progress, count), `${mode}-${category}-${Date.now()}`);
    return withBalancedAnswerPositions(balancedDifficultyQuestions(pool, count, progress, `${mode}-${category}-${subCategory}-${Date.now()}`, mode), `${mode}-${category}-${subCategory}-${Date.now()}`);
  }
  let selected = balancedDifficultyQuestions(pool, count, progress, `${mode}-${category}-${subCategory}-${Date.now()}`, mode);
  if (selected.length < count && subCategory !== "All Topics") {
    const fallback = bank.filter((q) => q.category === category && q.subCategory !== subCategory);
    selected = mergeUniqueQuestions(selected, fallback, count, `${mode}-${category}-fallback-${Date.now()}`);
  }
  return withBalancedAnswerPositions(selected.slice(0, count), `${mode}-${category}-${subCategory}-${Date.now()}`);
}

function categorizeText(text) {
  const lower = text.toLowerCase();
  const scores = Object.entries(TOPIC_KEYWORDS).map(([category, words]) => ({ category, score: words.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0) }));
  return scores.sort((a, b) => b.score - a.score)[0]?.category || "General Information";
}

function extractTopics(text) {
  const lower = text.toLowerCase();
  const topics = CATEGORIES.flatMap((cat) => cat.subs).filter((topic) => lower.includes(topic.toLowerCase().split(" ")[0]));
  return [...new Set(topics)].slice(0, 12);
}

function generatedFromImport(importItem, count = 12) {
  const category = importItem.category;
  const importTopics = Array.isArray(importItem.topics) ? importItem.topics : [];
  const topics = importTopics.length ? importTopics : (CATEGORIES.find((c) => c.name === category)?.subs || ["Reviewer Concepts"]).slice(0, 4);
  return Array.from({ length: count }, (_, i) => {
    const topic = topics[i % topics.length];
    const id = `IMP-${importItem.id}-${i}`;
    const answer = `Apply the ${topic} rule using the facts given`;
    return makeQuestion({
      id,
      category,
      subCategory: topic,
      difficulty: DIFFICULTIES[i % 3],
      question: `Based on imported reviewer "${importItem.name}", which approach is best for a ${topic} Civil Service item?`,
      choices: [answer, "Choose the longest option without checking the rule", "Ignore keywords and rely on memory only", "Use the same answer letter pattern from previous items"],
      answer,
      explanation: `This imported-reviewer variation is categorized under ${category}. The best approach is to identify the tested concept, use the facts in the item, and eliminate choices that do not match the rule.`,
      hint: "Look for the concept keyword and match it to the rule.",
      learningTip: `Review the imported notes for ${topic}, then answer similar variations until your reasoning is consistent.`
    });
  });
}

function toQuestionBankRow(q, meta = {}) {
  return {
    id: q.id,
    category: q.category,
    sub_category: q.subCategory,
    difficulty: q.difficulty,
    question: cleanQuestionText(q.question),
    choices: q.choices,
    answer: q.answer,
    explanation: q.explanation,
    hint: q.hint,
    learning_tip: q.learningTip,
    source: meta.source || "Imported",
    status: meta.status || "Approved",
    tags: meta.tags || [q.category, q.subCategory],
    date_generated: meta.dateGenerated || new Date().toISOString(),
    approved_by: meta.approvedBy || "Admin",
    approved_at: meta.approvedAt || new Date().toISOString()
  };
}

const AI_STUDIO_MODULES = ["AI Question Generator", "AI Lesson Generator", "AI Review Notes Generator", "AI Current Events Generator", "AI Content Audit"];
const AI_COUNTS = [10, 20, 30, 50];
const AI_DIFFICULTIES = ["Easy", "Moderate", "Difficult"];
const toBankDifficulty = (difficulty) => difficulty === "Moderate" ? "Medium" : difficulty === "Difficult" ? "Hard" : difficulty;

function aiQuestionStem(category, topic, difficulty, index) {
  const scenario = ["permit request", "citizen complaint", "records audit", "budget review", "public advisory", "training session", "procurement check", "disaster response", "online service", "frontline interview"][index % 10];
  if (category === "Numerical Ability") return `A ${scenario} involves ${24 + index} completed items out of ${80 + index * 2} total items. Which computation best applies the ${topic} concept?`;
  if (category === "Verbal Ability") return `In a ${scenario}, which option best demonstrates ${topic} in formal Civil Service exam style?`;
  if (category === "Analytical Ability") return `A ${scenario} includes a statement, evidence, and a possible conclusion. Which option best applies ${topic} reasoning?`;
  return `A government office handles a ${scenario}. Which action best reflects ${topic} under public-service standards?`;
}

function aiCorrectAnswer(category, topic, index) {
  if (category === "Numerical Ability") return `Use the ${topic} formula with the stated base before computing`;
  if (category === "Verbal Ability") return `Choose the wording that matches context, grammar, and formal tone`;
  if (category === "Analytical Ability") return `Accept only the conclusion supported by the stated facts`;
  if (topic === "Current Events") return "Use verified public information and connect it to government service impact";
  return `Apply the ${topic} principle with fairness, accountability, and legal basis`;
}

function createAiQuestionDrafts({ category, topic, difficulty, count, existingQuestions, adminEmail }) {
  const bankDifficulty = toBankDifficulty(difficulty);
  return Array.from({ length: Number(count) || 10 }, (_, index) => {
    const id = `AI-${Date.now()}-${hashText(`${category}-${topic}-${difficulty}-${index}`)}`;
    const answer = aiCorrectAnswer(category, topic, index);
    const choices = qualityChoices([answer, ...plausibleDistractors(category, topic, answer, id)], answer, category, topic, id);
    const question = makeQuestion({
      id,
      category,
      subCategory: topic,
      difficulty: bankDifficulty,
      question: aiQuestionStem(category, topic, difficulty, index),
      choices,
      answer,
      explanation: `Draft explanation: identify the tested ${topic} rule, compare each option against the facts, and choose the answer that is supported without adding assumptions. This item must be reviewed before publishing.`,
      hint: `Look for the ${topic} rule and reject choices that use a different principle.`,
      learningTip: `After approval, use this ${topic} item to strengthen analysis rather than memorized answer patterns.`
    });
    const qSig = questionSignature(question);
    const duplicates = existingQuestions.filter((item) => questionSignature(item) === qSig).slice(0, 3);
    return {
      ...question,
      draftId: id,
      source: "AI",
      status: "Draft",
      tags: [category, topic, bankDifficulty, "admin-reviewed-required"],
      dateGenerated: new Date().toISOString(),
      generatedBy: adminEmail || "Admin",
      audit: {
        duplicateQuestions: duplicates.map((item) => item.id),
        duplicateDistractors: question.choices.filter((choice, choiceIndex, arr) => choice !== question.answer && arr.indexOf(choice) !== choiceIndex),
        notes: duplicates.length ? "Potential duplicate question wording detected." : "No exact duplicate question wording detected."
      }
    };
  });
}

function createAiLessonDraft({ category, topic, adminEmail }) {
  const review = reviewContentFor(category, topic);
  const id = `AIL-${Date.now()}-${hashText(`${category}-${topic}`)}`;
  return {
    id,
    category,
    topic,
    source: "AI",
    status: "Draft",
    dateGenerated: new Date().toISOString(),
    generatedBy: adminEmail || "Admin",
    content: {
      lessonContent: review.lessons,
      coreConcepts: review.concepts,
      notes: review.definitions,
      reviewMaterials: review.examples,
      examStrategies: review.patterns,
      tipsAndTricks: review.tips,
      topicGuides: review.rules,
      memoryTechniques: review.memory,
      commonExamPatterns: review.patterns,
      practiceExamples: review.worked
    },
    audit: { notes: "Lesson draft generated from the topic reviewer model. Admin must edit or approve before publishing." }
  };
}

function contentAuditReport(bank) {
  const byTopic = CATEGORIES.flatMap((cat) => cat.subs.map((sub) => {
    const rows = bank.filter((q) => q.category === cat.name && q.subCategory === sub);
    const distractorCounts = rows.flatMap((q) => q.choices.filter((choice) => choice !== q.answer)).reduce((map, choice) => ({ ...map, [choice]: (map[choice] || 0) + 1 }), {});
    const repeated = Object.entries(distractorCounts).filter(([, count]) => count > 12).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { category: cat.name, topic: sub, questions: rows.length, mockCapacity: Math.floor(rows.length / 25), repeated };
  }));
  return byTopic;
}

function choiceInsight(q, choice, index) {
  if (choice === q.answer) return `${choiceLetters[index]} is correct because it matches the tested rule and the situation exactly.`;
  if (q.category === "Verbal Ability") return `${choiceLetters[index]} is wrong because it does not fit the sentence context, grammar pattern, tone, or passage evidence as well as the correct answer.`;
  if (q.category === "General Information") return `${choiceLetters[index]} is wrong because it points to a different public-service principle or contradicts the government situation described.`;
  return `${choiceLetters[index]} is wrong because it uses the wrong relationship, operation, or assumption for this item.`;
}

function masteryLevel(accuracy, total) {
  if (!total || accuracy <= 39) return "Beginner";
  if (accuracy <= 59) return "Developing";
  if (accuracy <= 79) return "Proficient";
  return "Mastered";
}

function topicTrend(progress, subCategory) {
  const rows = Object.values(progress.answered || {}).filter((r) => r.subCategory === subCategory).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  if (rows.length < 4) return 0;
  const half = Math.floor(rows.length / 2);
  const early = rows.slice(0, half);
  const recent = rows.slice(-half);
  return pct(recent.filter((r) => r.status === "correct").length, recent.length) - pct(early.filter((r) => r.status === "correct").length, early.length);
}

function achievementList(progress, stats) {
  const numerical = stats.categoryStats.find((s) => s.name === "Numerical Ability");
  const latestSession = progress.sessions.at(-1);
  return [
    { title: "First 50 Correct", detail: "50 correct answers recorded", earned: stats.correct >= 50 },
    { title: "3-Day Streak", detail: "Study consistency badge", earned: progress.streak >= 3 },
    { title: "80% Numerical", detail: "Numerical Ability accuracy target", earned: (numerical?.accuracy || 0) >= 80 && (numerical?.total || 0) >= 10 },
    { title: "No Skipped Items", detail: "Completed a session without skipping", earned: !!latestSession && latestSession.skipped === 0 }
  ];
}

function mockExamNumber(mode) {
  const match = String(mode || "").match(/^Mock Exam (\d+)$/);
  return match ? Number(match[1]) : 0;
}

function hasPassedMock(progress, number) {
  return (progress.sessions || []).some((session) => session.mode === `Mock Exam ${number}` && session.accuracy >= 80);
}

function isMockUnlocked(progress, mode) {
  const number = mockExamNumber(mode);
  if (!number || number === 1) return true;
  return hasPassedMock(progress, number - 1);
}

function mockHistoryKey(category, subCategory) {
  return `${category || "All Categories"}|${subCategory || "All Topics"}`;
}

function lessonFor(category, topic) {
  return TOPIC_LESSONS.find((lesson) => lesson.category === category && lesson.topic === topic) || null;
}

function deviceFingerprint() {
  if (typeof window === "undefined") return "server";
  const raw = `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return `device-${hash.toString(16)}`;
}

function deviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const type = /Mobi|Android/i.test(ua) ? "Mobile Phone" : /Tablet|iPad/i.test(ua) ? "Tablet" : "Desktop/Laptop";
  const browser = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Browser";
  return `${type} - ${browser}`;
}

function Ring({ value, size = 92, label }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 90 90" className="absolute inset-0 -rotate-90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="9" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="url(#ring)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
        <defs><linearGradient id="ring" x1="0" x2="1"><stop stopColor="#22c55e" /><stop offset="1" stopColor="#38bdf8" /></linearGradient></defs>
      </svg>
      <div className="text-center"><div className="text-xl font-black">{value}%</div><div className="text-[10px] text-white/55">{label}</div></div>
    </div>
  );
}

function Pill({ children, className = "" }) {
  return <span className={`inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ${className}`}>{children}</span>;
}

function formatSeconds(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function secondsUntil(isoOrMs) {
  const target = typeof isoOrMs === "number" ? isoOrMs : new Date(isoOrMs || 0).getTime();
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
}

const TrialCountdown = memo(function TrialCountdown({ expiresAt, userId, onExpired, prefix = "Trial" }) {
  const [remaining, setRemaining] = useState(() => secondsUntil(expiresAt));
  const expiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => {
      const next = secondsUntil(expiresAt);
      setRemaining((current) => (current === next ? current : next));
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpiredRef.current?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, userId]);

  return <Pill>{prefix} {formatSeconds(remaining)}</Pill>;
});

const ExamCountdown = memo(function ExamCountdown({ endsAt, active, onExpire }) {
  const [remaining, setRemaining] = useState(() => secondsUntil(endsAt));
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!active || !endsAt) {
      setRemaining(0);
      return;
    }
    expiredRef.current = false;
    const tick = () => {
      const next = secondsUntil(endsAt);
      setRemaining((current) => (current === next ? current : next));
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active, endsAt]);

  return <>{formatSeconds(remaining)}</>;
});

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState("dashboard");
  const [category, setCategory] = useState("All Categories");
  const [subCategory, setSubCategory] = useState("All Topics");
  const [mode, setMode] = useState("Mini Quiz");
  const [exam, setExam] = useState(null);
  const [reviewFilter, setReviewFilter] = useState("All");
  const [learningTab, setLearningTab] = useState("Learn");
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [activeLesson, setActiveLesson] = useState(TOPIC_LESSONS[0]);
  const [authSession, setAuthSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cloudUsers, setCloudUsers] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [aiStudioModule, setAiStudioModule] = useState("AI Question Generator");
  const [aiStudioCategory, setAiStudioCategory] = useState("Verbal Ability");
  const [aiStudioTopic, setAiStudioTopic] = useState("Vocabulary");
  const [aiStudioDifficulty, setAiStudioDifficulty] = useState("Moderate");
  const [aiStudioCount, setAiStudioCount] = useState(10);
  const [aiStudioMessage, setAiStudioMessage] = useState("");
  const [loginHistory, setLoginHistory] = useState([]);
  const [deviceSessions, setDeviceSessions] = useState([]);
  const [cloudQuestionRows, setCloudQuestionRows] = useState([]);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState("");
  const cloudRefreshInFlightRef = useRef(false);
  const loadedSessionKeyRef = useRef("");
  const profileLoadedRef = useRef(false);
  const allQuestions = useMemo(() => expandQuestionPool(buildQuestionBank(progress, cloudQuestionRows), 360), [cloudQuestionRows]);
  const stats = useMemo(() => analyze(progress, allQuestions), [progress, allQuestions]);
  const readiness = useMemo(() => {
    const mockCompleted = progress.sessions.filter((s) => s.mode?.includes("Mock") || s.mode === "Full Mock Exam").length;
    const masteryPassed = progress.sessions.filter((s) => s.mode === "Mastery Test" && s.accuracy >= 80).length;
    const score = Math.min(100, Math.round(stats.accuracy * 0.45 + stats.progress * 0.25 + Math.min(mockCompleted * 6, 18) + Math.min(masteryPassed * 4, 12)));
    return { score, mockCompleted, masteryPassed, status: score >= 85 ? "READY FOR PROFESSIONAL CIVIL SERVICE EXAM" : score >= 70 ? "NEAR READY - strengthen weak topics" : "BUILDING FOUNDATION" };
  }, [progress.sessions, stats]);
  const rankInfo = useMemo(() => getRankInfo(stats, progress, readiness), [stats, progress, readiness]);
  const availableTopics = useMemo(() => {
    const topicSet = new Set(allQuestions.filter((q) => category === "All Categories" || q.category === category).map((q) => q.subCategory));
    return ["All Topics", ...Array.from(topicSet).sort()];
  }, [category, allQuestions]);
  const achievements = useMemo(() => achievementList(progress, stats), [progress, stats]);
  const selectedLesson = useMemo(() => lessonFor(category, subCategory), [category, subCategory]);
  const foundingMembers = useMemo(() => cloudUsers.filter((user) => user.status === "Approved").slice(0, FOUNDING_MEMBER_LIMIT), [cloudUsers]);
  const remainingFoundingSlots = Math.max(0, FOUNDING_MEMBER_LIMIT - foundingMembers.length);

  const trialExpiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at).getTime() : 0;
  const trialActiveNow = profile?.status === "Trial Active" && trialExpiresAt > Date.now();
  const hasAccess = profile?.status === "Approved" || trialActiveNow;
  const isAdmin = profile?.role === "Admin";

  function setSupabaseError(label, error) {
    if (!error) return;
    console.warn(`[CSE Supabase] ${label}`, error);
  }

  useEffect(() => {
    const topics = CATEGORIES.find((cat) => cat.name === aiStudioCategory)?.subs || [];
    if (topics.length && !topics.includes(aiStudioTopic)) setAiStudioTopic(topics[0]);
  }, [aiStudioCategory, aiStudioTopic]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const hasOAuthParams = url.searchParams.has("code") || url.searchParams.has("error") || url.searchParams.has("error_description");
    if (url.pathname === "/" && hasOAuthParams) {
      window.location.replace(`/auth/callback${url.search}`);
    }
  }, []);

  useEffect(() => {
    if (!cloudLoading && hasAccess && !progress.onboardingComplete) setShowTour(true);
  }, [cloudLoading, hasAccess, progress.onboardingComplete]);

  async function ensureCloudProfile(session) {
    if (!supabase || !session?.user) return;
    const user = session.user;
    const now = new Date().toISOString();
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Student";

    const existingUserResult = await supabase.from("users").select("id,email").eq("id", user.id).maybeSingle();
    setSupabaseError("users lookup failed", existingUserResult.error);
    if (!existingUserResult.data) {
      const insertUserResult = await supabase.from("users").insert({ id: user.id, email: user.email, full_name: fullName, created_at: user.created_at });
      setSupabaseError("users insert failed", insertUserResult.error);
    }

    const profileLookup = await supabase.from("user_profiles").select("user_id,status,role,trial_expires_at").eq("user_id", user.id).maybeSingle();
    setSupabaseError("profile lookup failed", profileLookup.error);
    const existingProfile = profileLookup.data;
    if (existingProfile) {
      const updateProfileResult = await supabase.from("user_profiles").update({ full_name: fullName, gmail_address: user.email, last_login: now, updated_at: now }).eq("user_id", user.id);
      setSupabaseError("profile update failed", updateProfileResult.error);
    } else {
      const insertProfileResult = await supabase.from("user_profiles").insert({
        user_id: user.id,
        full_name: fullName,
        gmail_address: user.email,
        last_login: now,
        status: "Trial Active",
        role: "Student",
        trial_started_at: now,
        trial_expires_at: new Date(Date.now() + TRIAL_MINUTES * 60 * 1000).toISOString()
      });
      setSupabaseError("trial/profile creation failed", insertProfileResult.error);
    }
    const progressLookup = await supabase.from("user_progress").select("user_id").eq("user_id", user.id).maybeSingle();
    setSupabaseError("progress lookup failed", progressLookup.error);
    if (!progressLookup.data) {
      const insertProgressResult = await supabase.from("user_progress").insert({ user_id: user.id, app_state: initialProgress });
      setSupabaseError("progress initialization failed", insertProgressResult.error);
    }
    const analyticsResult = await supabase.from("analytics").upsert({ user_id: user.id }, { onConflict: "user_id" });
    setSupabaseError("analytics initialization failed", analyticsResult.error);
  }

  async function refreshCloudState(session = authSession, options = {}) {
    if (!supabase || !session?.user) {
      setCloudLoading(false);
      return;
    }
    const showLoading = options.showLoading ?? !profileLoadedRef.current;
    const sessionKey = `${session.user.id}:${session.access_token?.slice(-18) || "no-token"}`;
    if (cloudRefreshInFlightRef.current) {
      return;
    }
    if (loadedSessionKeyRef.current === sessionKey) {
      return;
    }
    cloudRefreshInFlightRef.current = true;
    if (showLoading) setCloudLoading(true);
    try {
      await ensureCloudProfile(session);
      const userId = session.user.id;
      const [profileResult, progressResult, historyResult, deviceResult, questionBankResult] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_progress").select("app_state").eq("user_id", userId).single(),
        supabase.from("login_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
        supabase.from("device_sessions").select("*").eq("user_id", userId).order("last_login", { ascending: false }),
        supabase.from("question_bank").select("*").limit(5000)
      ]);
      setSupabaseError("profile fetch failed", profileResult.error);
      setSupabaseError("progress fetch failed", progressResult.error);
      setSupabaseError("login history fetch failed", historyResult.error);
      setSupabaseError("device sessions fetch failed", deviceResult.error);
      setSupabaseError("question bank fetch failed", questionBankResult.error);
      const profileRow = profileResult.data;
      const progressRow = progressResult.data;
      const historyRows = historyResult.data;
      const deviceRows = deviceResult.data;
      if (profileRow) {
        profileLoadedRef.current = true;
        setProfile(profileRow);
      }
      if (progressRow?.app_state && Object.keys(progressRow.app_state).length) setProgress({ ...initialProgress, ...progressRow.app_state });
      setLoginHistory(historyRows || []);
      setDeviceSessions(deviceRows || []);
      setCloudQuestionRows(questionBankResult.data || []);
      await registerDeviceSession(userId);
      if (profileRow?.role === "Admin") await loadAdminUsers();
      loadedSessionKeyRef.current = sessionKey;
      setScreen("dashboard");
    } finally {
      cloudRefreshInFlightRef.current = false;
      setCloudLoading(false);
    }
  }

  async function registerDeviceSession(userId) {
    if (!supabase || !userId) return;
    const now = new Date().toISOString();
    const device_id = deviceFingerprint();
    const device_info = deviceLabel();
    const activeDeviceResult = await supabase.from("device_sessions").select("*").eq("user_id", userId).eq("active", true).order("last_login", { ascending: false });
    const activeDevices = activeDeviceResult.data;
    setSupabaseError("active device lookup failed", activeDeviceResult.error);
    const known = (activeDevices || []).some((d) => d.device_id === device_id);
    if (!known && (activeDevices || []).length >= MAX_ACTIVE_DEVICES) {
      setAccessMessage("Maximum active devices reached. Please contact the administrator to reset device access.");
      await supabase.from("login_history").insert({ user_id: userId, device_id, device_info, action: "DEVICE_LIMIT_BLOCKED" });
      await supabase.auth.signOut();
      return;
    }
    const deviceResult = await supabase.from("device_sessions").upsert({ user_id: userId, device_id, device_info, last_login: now, active: true }, { onConflict: "user_id,device_id" });
    setSupabaseError("device session upsert failed", deviceResult.error);
    const historyResult = await supabase.from("login_history").insert({ user_id: userId, device_id, device_info, action: "LOGIN" });
    setSupabaseError("login history insert failed", historyResult.error);
  }

  async function loadAdminUsers() {
    if (!supabase) return;
    setAdminMessage("");
    const profileResult = await supabase.from("user_profiles").select("*").order("registration_date", { ascending: false });
    if (profileResult.error) {
      setSupabaseError("admin user profile lookup failed", profileResult.error);
      setAdminMessage("Admin user list is temporarily unavailable. Your account access is still active.");
      setCloudUsers([]);
      return;
    }
    const profiles = profileResult.data || [];
    const userIds = profiles.map((user) => user.user_id).filter(Boolean);
    if (!userIds.length) {
      setCloudUsers([]);
      return;
    }
    const [deviceResult, historyResult] = await Promise.all([
      supabase.from("device_sessions").select("*").in("user_id", userIds).order("last_login", { ascending: false }),
      supabase.from("login_history").select("*").in("user_id", userIds).order("created_at", { ascending: false }).limit(300)
    ]);
    if (deviceResult.error || historyResult.error) {
      setSupabaseError("admin session detail lookup failed", deviceResult.error || historyResult.error);
      setAdminMessage("Some admin session details are temporarily unavailable.");
    }
    const devicesByUser = (deviceResult.data || []).reduce((map, row) => {
      (map[row.user_id] ||= []).push(row);
      return map;
    }, {});
    const historyByUser = (historyResult.data || []).reduce((map, row) => {
      (map[row.user_id] ||= []).push(row);
      return map;
    }, {});
    setCloudUsers(profiles.map((user) => ({
      ...user,
      device_sessions: devicesByUser[user.user_id] || [],
      login_history: historyByUser[user.user_id] || []
    })));
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setCloudLoading(false);
      setAccessMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud access.");
      return;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAccessMessage(error.message);
      }
      setAuthSession(data.session);
      if (data.session) refreshCloudState(data.session, { showLoading: !profileLoadedRef.current, reason: "initial getSession" });
      else setCloudLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setAccessMessage("");
      setAuthSession(session);
      if (session && ["INITIAL_SESSION", "SIGNED_IN", "USER_UPDATED"].includes(event)) refreshCloudState(session, { showLoading: !profileLoadedRef.current, reason: event });
      else if (session) return;
      else {
        profileLoadedRef.current = false;
        setProfile(null);
        setProgress(initialProgress);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleTrialExpired = useCallback(() => {
    if (!profile?.user_id || profile.status !== "Trial Active") return;
    setAccessMessage("Your trial access has ended. Please contact the administrator for full access.");
    setProfile((current) => current?.user_id === profile.user_id ? { ...current, status: "Expired" } : current);
    if (supabase) {
      supabase.from("user_profiles").update({ status: "Expired" }).eq("user_id", profile.user_id);
    }
  }, [profile?.user_id, profile?.status]);

  useEffect(() => {
    if (!supabase || !authSession?.user || cloudLoading) return;
    const timer = setTimeout(() => {
      supabase.from("user_progress").upsert({
        user_id: authSession.user.id,
        app_state: progress,
        analytics: { stats, readiness },
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    }, 800);
    return () => clearTimeout(timer);
  }, [progress, authSession?.user?.id, cloudLoading]);

  function resetProgress() {
    if (!window.confirm("Are you sure you want to reset your scores?\n\nThis action cannot be undone.")) return;
    setProgress(initialProgress);
    setExam(null);
    setScreen("dashboard");
    if (supabase && authSession?.user) {
      supabase.from("user_progress").upsert({ user_id: authSession.user.id, app_state: initialProgress }, { onConflict: "user_id" });
    }
  }

  function generateAiStudioDrafts() {
    if (!isAdmin) return;
    setAiStudioMessage("");
    if (aiStudioModule === "AI Question Generator" || aiStudioModule === "AI Current Events Generator") {
      const category = aiStudioModule === "AI Current Events Generator" ? "General Information" : aiStudioCategory;
      const topic = aiStudioModule === "AI Current Events Generator" ? "Current Events" : aiStudioTopic;
      const drafts = createAiQuestionDrafts({
        category,
        topic,
        difficulty: aiStudioDifficulty,
        count: aiStudioCount,
        existingQuestions: allQuestions,
        adminEmail: profile?.gmail_address
      });
      setProgress((p) => ({ ...p, aiDrafts: [...drafts, ...(p.aiDrafts || [])].slice(0, 250) }));
      setAiStudioMessage(`${drafts.length} AI question drafts created. Review, edit, and approve before students can see them.`);
      return;
    }
    const lesson = createAiLessonDraft({ category: aiStudioCategory, topic: aiStudioTopic, adminEmail: profile?.gmail_address });
    setProgress((p) => ({ ...p, aiLessons: [lesson, ...(p.aiLessons || [])].slice(0, 80) }));
    setAiStudioMessage("AI lesson/review draft created. Review and approve before publishing to lessons.");
  }

  function updateAiDraftStatus(draftId, status) {
    setProgress((p) => ({
      ...p,
      aiDrafts: (p.aiDrafts || []).map((draft) => draft.draftId === draftId ? { ...draft, status } : draft),
      aiLessons: (p.aiLessons || []).map((draft) => draft.id === draftId ? { ...draft, status } : draft)
    }));
  }

  function editAiDraft(draftId) {
    const current = (progress.aiDrafts || []).find((draft) => draft.draftId === draftId);
    if (!current) return;
    const updatedQuestion = window.prompt("Edit question text before approval:", current.question.replace(/^Item\s+[A-Z0-9-]+:\s*/i, ""));
    if (!updatedQuestion) return;
    setProgress((p) => ({
      ...p,
      aiDrafts: (p.aiDrafts || []).map((draft) => draft.draftId === draftId ? { ...draft, question: `Item ${draft.id}: ${updatedQuestion}`, status: "Draft" } : draft)
    }));
  }

  async function approveAiQuestion(draft) {
    if (!isAdmin || !draft) return;
    const approved = { ...draft, status: "Approved", approvedBy: profile?.gmail_address || "Admin", approvedAt: new Date().toISOString() };
    const cloudPayload = {
      id: approved.id,
      category: approved.category,
      sub_category: approved.subCategory,
      difficulty: approved.difficulty,
      question: approved.question.replace(/^Item\s+[A-Z0-9-]+:\s*/i, ""),
      choices: approved.choices,
      answer: approved.answer,
      explanation: approved.explanation,
      hint: approved.hint,
      learning_tip: approved.learningTip,
      source: "AI",
      status: "Approved",
      tags: approved.tags,
      date_generated: approved.dateGenerated,
      approved_by: approved.approvedBy,
      approved_at: approved.approvedAt
    };
    let saved = false;
    if (supabase) {
      const insertResult = await supabase.from("question_bank").upsert(cloudPayload, { onConflict: "id" });
      if (insertResult.error) {
        setSupabaseError("AI question publish with metadata failed", insertResult.error);
        const fallbackResult = await supabase.from("question_bank").upsert({
          id: cloudPayload.id,
          category: cloudPayload.category,
          sub_category: cloudPayload.sub_category,
          difficulty: cloudPayload.difficulty,
          question: cloudPayload.question,
          choices: cloudPayload.choices,
          answer: cloudPayload.answer,
          explanation: cloudPayload.explanation,
          hint: cloudPayload.hint,
          learning_tip: cloudPayload.learning_tip,
          source: "AI"
        }, { onConflict: "id" });
        setSupabaseError("AI question publish fallback failed", fallbackResult.error);
        saved = !fallbackResult.error;
      } else saved = true;
    }
    setCloudQuestionRows((rows) => [{ ...cloudPayload, sub_category: cloudPayload.sub_category, learning_tip: cloudPayload.learning_tip }, ...rows.filter((row) => row.id !== cloudPayload.id)]);
    updateAiDraftStatus(draft.draftId, saved ? "Approved" : "Approved");
    setAiStudioMessage(saved ? "Question approved and published to the existing question bank." : "Question approved locally. Run the AI schema migration if Supabase publish is blocked by RLS or missing columns.");
  }

  async function publishImportedReviewer(importItem) {
    if (!isAdmin || !importItem) return;
    if (!supabase) {
      setImportMessage("Supabase is not configured, so imported questions cannot be transferred to the cloud bank yet.");
      return;
    }
    const approvedBy = profile?.gmail_address || "Admin";
    const count = Math.max(80, ((importItem.topics || []).length || 4) * 50);
    const questions = generatedFromImport(importItem, count);
    const rows = questions.map((q) => toQuestionBankRow(q, {
      source: "Imported",
      status: "Approved",
      approvedBy,
      tags: ["imported-reviewer", importItem.name, q.category, q.subCategory]
    }));
    setImportBusy(true);
    setImportMessage(`Publishing ${rows.length} approved questions from ${importItem.name}...`);
    let savedRows = [];
    try {
      for (let index = 0; index < rows.length; index += 200) {
        const batch = rows.slice(index, index + 200);
        let result = await supabase.from("question_bank").upsert(batch, { onConflict: "id" }).select("*");
        if (result.error) {
          setSupabaseError("imported reviewer publish with metadata failed", result.error);
          const fallbackBatch = batch.map((row) => ({
            id: row.id,
            category: row.category,
            sub_category: row.sub_category,
            difficulty: row.difficulty,
            question: row.question,
            choices: row.choices,
            answer: row.answer,
            explanation: row.explanation,
            hint: row.hint,
            learning_tip: row.learning_tip,
            source: row.source,
            status: row.status
          }));
          result = await supabase.from("question_bank").upsert(fallbackBatch, { onConflict: "id" }).select("*");
          if (result.error) {
            setSupabaseError("imported reviewer publish fallback failed", result.error);
            const reason = result.error.message || "Supabase rejected the transfer.";
            setImportMessage(`Transfer failed: ${reason}. Confirm glensndr@gmail.com has role Admin and status Approved, then verify question_bank RLS policies are deployed.`);
            return;
          }
        }
        savedRows = [...savedRows, ...(result.data || batch)];
      }
      setCloudQuestionRows((currentRows) => {
        const publishedIds = new Set(savedRows.map((row) => row.id));
        return [...savedRows, ...currentRows.filter((row) => !publishedIds.has(row.id))];
      });
      setProgress((p) => ({
        ...p,
        imports: (p.imports || []).map((item) => item.id === importItem.id ? {
          ...item,
          publishedAt: new Date().toISOString(),
          publishedCount: rows.length,
          publishedBy: approvedBy
        } : item)
      }));
      setImportMessage(`${rows.length} questions approved and transferred to the active Supabase question bank.`);
    } finally {
      setImportBusy(false);
    }
  }

  async function approveAiLesson(draft) {
    if (!isAdmin || !draft) return;
    const approved = { ...draft, status: "Approved", approvedBy: profile?.gmail_address || "Admin", approvedAt: new Date().toISOString() };
    if (supabase) {
      const result = await supabase.from("lessons").upsert({ id: approved.id, category: approved.category, topic: approved.topic, content: approved.content }, { onConflict: "id" });
      setSupabaseError("AI lesson publish failed", result.error);
    }
    setProgress((p) => ({ ...p, aiLessons: (p.aiLessons || []).map((item) => item.id === draft.id ? approved : item) }));
    setAiStudioMessage("Lesson draft approved. It is stored for the Review Center content pipeline.");
  }

  function completeTour() {
    setShowTour(false);
    setTourStep(0);
    setProgress((p) => ({ ...p, onboardingComplete: true }));
  }

  async function gmailLogin() {
    if (!supabase) {
      setAccessMessage("Supabase is not configured. Add environment variables before using Gmail authentication.");
      return;
    }
    setAccessMessage("");
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { hd: "gmail.com", prompt: "select_account" }
      }
    });
    if (error) setAccessMessage(`Google login failed: ${error.message}`);
  }

  async function logoutAccount() {
    if (supabase && authSession?.user) {
      await supabase.from("login_history").insert({ user_id: authSession.user.id, device_id: deviceFingerprint(), device_info: deviceLabel(), action: "LOGOUT" });
      await supabase.auth.signOut();
    }
    setAuthSession(null);
    profileLoadedRef.current = false;
    setProfile(null);
    setScreen("dashboard");
  }

  async function updateUserStatus(userId, status) {
    if (!supabase || !isAdmin) return;
    await supabase.from("user_profiles").update({ status, updated_at: new Date().toISOString() }).eq("user_id", userId);
    await loadAdminUsers();
  }

  async function extendTrial(userId) {
    if (!supabase || !isAdmin) return;
    const expires = new Date(Date.now() + TRIAL_MINUTES * 60 * 1000).toISOString();
    await supabase.from("user_profiles").update({ status: "Trial Active", trial_started_at: new Date().toISOString(), trial_expires_at: expires, updated_at: new Date().toISOString() }).eq("user_id", userId);
    await loadAdminUsers();
  }

  async function readReviewerFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "txt") return await file.text();
    if (ext === "docx") {
      const mammoth = await import("mammoth/mammoth.browser");
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }
    if (ext === "pdf") {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const pages = [];
      const maxPages = Math.min(pdf.numPages, 12);
      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(" "));
      }
      return pages.join("\n");
    }
    return file.name;
  }

  async function importReviewers(files) {
    setImportBusy(true);
    try {
      const imported = [];
      for (const file of Array.from(files)) {
        const text = await readReviewerFile(file);
        const fallbackText = text.trim() || file.name;
        const categoryGuess = categorizeText(`${file.name} ${fallbackText}`);
        const topics = extractTopics(`${file.name} ${fallbackText}`);
        imported.push({
          id: `${file.name}-${file.size}-${file.lastModified}`.replace(/[^a-z0-9]/gi, "-"),
          name: file.name,
          size: file.size,
          type: file.type || file.name.split(".").pop().toUpperCase(),
          category: categoryGuess,
          topics,
          lessons: fallbackText.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 40).slice(0, 8),
          concepts: fallbackText.split(/[.;\n]+/).map((line) => line.trim()).filter((line) => line.length > 20 && line.length < 180).slice(0, 12),
          importedAt: new Date().toISOString()
        });
      }
      setProgress((p) => ({ ...p, imports: [...(p.imports || []), ...imported].slice(-30) }));
      setScreen("admin");
    } finally {
      setImportBusy(false);
    }
  }

  function toggleBookmark(q) {
    setProgress((p) => {
      const bookmarks = { ...(p.bookmarks || {}) };
      if (bookmarks[q.id]) {
        delete bookmarks[q.id];
        if (supabase && authSession?.user) supabase.from("bookmarks").delete().eq("user_id", authSession.user.id).eq("question_id", q.id);
      } else {
        bookmarks[q.id] = { id: q.id, category: q.category, subCategory: q.subCategory, question: q.question, date: new Date().toISOString() };
        if (supabase && authSession?.user) supabase.from("bookmarks").upsert({ user_id: authSession.user.id, question_id: q.id, label: "Review Later" }, { onConflict: "user_id,question_id" });
      }
      return { ...p, bookmarks };
    });
  }

  function startExam(nextCategory = category, nextMode = mode, nextSubCategory = subCategory) {
    const safeSub = nextCategory === "All Categories" && nextMode === "Full Mock Exam" ? "All Topics" : nextSubCategory;
    const qs = selectQuestions(nextCategory, nextMode, progress, safeSub, allQuestions);
    if (!qs.length) {
      alert("The active question bank is currently empty. Add approved questions from Admin Import or AI Content Studio before starting an exam.");
      return;
    }
    setCategory(nextCategory); setMode(nextMode); setSubCategory(safeSub);
    const timedModes = ["Timed Exam", ...MOCK_EXAM_MODES, "Full Mock Exam"];
    const mockNumber = mockExamNumber(nextMode);
    const limit = nextMode === "Full Mock Exam" ? 10200 : mockNumber ? Math.min(10200, 3000 + (mockNumber - 1) * 800) : 7200;
    const timed = timedModes.includes(nextMode);
    setExam({ questions: qs, index: 0, answers: {}, startedAt: Date.now(), currentStartedAt: Date.now(), timeLimit: timed ? limit : null, endsAt: timed ? Date.now() + limit * 1000 : null, submitted: false });
    setScreen("exam");
  }

  const handleExamExpired = useCallback(() => {
    if (!exam?.submitted) submitExam();
  }, [mode, category, subCategory, exam?.submitted]);

  function recordAnswer(q, selected, statusOverride) {
    setExam((e) => {
      const elapsed = Math.max(1, Math.round((Date.now() - e.currentStartedAt) / 1000));
      const status = statusOverride || (selected === q.answer ? "correct" : "wrong");
      return { ...e, answers: { ...e.answers, [q.id]: { selected, status, time: elapsed, question: q } } };
    });
    if (!["Timed Exam", ...MOCK_EXAM_MODES, "Full Mock Exam"].includes(mode)) {
      const elapsed = Math.max(1, Math.round((Date.now() - exam.currentStartedAt) / 1000));
      const status = statusOverride || (selected === q.answer ? "correct" : "wrong");
      setProgress((p) => ({
        ...p,
        xp: p.xp + (status === "correct" ? (q.difficulty === "Hard" ? 18 : q.difficulty === "Medium" ? 14 : 10) : 3),
        drillMastery: mode === "Wrong Drill" ? { ...(p.drillMastery || {}), [q.id]: status === "correct" ? (p.drillMastery?.[q.id] || 0) + 1 : 0 } : p.drillMastery,
        answered: { ...p.answered, [q.id]: { selected, status, time: elapsed, category: q.category, subCategory: q.subCategory, difficulty: q.difficulty, date: new Date().toISOString() } }
      }));
    }
  }

  function move(delta) {
    setExam((e) => ({ ...e, index: Math.min(Math.max(e.index + delta, 0), e.questions.length - 1), currentStartedAt: Date.now() }));
  }

  function submitExam() {
    if (!exam || exam.submitted) return;
    const finalAnswers = { ...exam.answers };
    exam.questions.forEach((q) => {
      if (!finalAnswers[q.id]) finalAnswers[q.id] = { selected: null, status: "skipped", time: 0, question: q };
    });
    const correct = Object.values(finalAnswers).filter((a) => a.status === "correct").length;
    setProgress((p) => {
      const answered = { ...p.answered };
      const drillMastery = { ...(p.drillMastery || {}) };
      const mockQuestionIds = { ...(p.mockQuestionIds || {}) };
      Object.entries(finalAnswers).forEach(([id, a]) => {
        answered[id] = { selected: a.selected, status: a.status, time: a.time, category: a.question.category, subCategory: a.question.subCategory, difficulty: a.question.difficulty, date: new Date().toISOString() };
        if (mode === "Wrong Drill") drillMastery[id] = a.status === "correct" ? (drillMastery[id] || 0) + 1 : 0;
      });
      if (mockExamNumber(mode)) {
        const key = mockHistoryKey(category, subCategory);
        mockQuestionIds[key] = [...new Set([...(mockQuestionIds[key] || []), ...exam.questions.map((q) => q.id)])].slice(-2000);
      }
      return { ...p, xp: p.xp + correct * 12 + (pct(correct, exam.questions.length) >= 80 ? 120 : 30), drillMastery, mockQuestionIds, answered, recentQuestionIds: [...exam.questions.map((q) => q.id), ...(p.recentQuestionIds || [])].slice(0, 240), sessions: [...p.sessions, { date: new Date().toISOString(), category, subCategory, mode, score: correct, total: exam.questions.length, skipped: Object.values(finalAnswers).filter((a) => a.status === "skipped").length, accuracy: pct(correct, exam.questions.length) }].slice(-20) };
    });
    setExam((e) => ({ ...e, answers: finalAnswers, submitted: true }));
    setScreen("results");
  }

  const Header = () => {
    return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button onClick={() => setScreen("dashboard")} className="flex items-center gap-3 text-left">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-sky-400 text-slate-950 shadow-glow"><GraduationCap /></div>
          <div><h1 className="text-base font-black sm:text-xl">Civil Service Exam Mastery</h1><p className="text-xs text-white/55">2026 Civil Service Exam Reviewer & Simulator</p></div>
        </button>
        <div className="hidden items-center gap-2 sm:flex">
          <button onClick={() => setScreen("learn")} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Learn</button>
          <button onClick={() => setScreen("admin")} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Admin Import</button>
          <button onClick={() => setScreen("account")} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{profile ? profile.full_name : "Gmail Login"}</button>
          {profile?.status === "Trial Active" && <TrialCountdown expiresAt={profile.trial_expires_at} userId={profile.user_id} onExpired={handleTrialExpired} />}
          <Pill><Flame className="mr-1 h-3.5 w-3.5 text-orange-300" />{progress.streak} day streak</Pill><Pill><Trophy className="mr-1 h-3.5 w-3.5 text-amber-300" />{rankInfo.current}</Pill>
        </div>
      </div>
    </div>
    );
  };

  const DynamicReviewCenter = () => {
    const selectedCategory = CATEGORIES.find((cat) => cat.name === category);
    const hasSelection = category !== "All Categories" && subCategory !== "All Topics";
    const topicSelected = !!selectedCategory && subCategory !== "All Topics";
    const lesson = topicSelected ? selectedLesson : null;
    const topicReview = topicSelected ? reviewContentFor(category, subCategory) : null;
    const completedMocks = MOCK_EXAM_MODES.filter((nextMode) => hasPassedMock(progress, mockExamNumber(nextMode))).length;
    const disabledClass = "cursor-not-allowed border border-white/10 bg-white/5 text-white/35";
    const run = (nextMode) => {
      if (!hasSelection) return;
      if (mockExamNumber(nextMode) && !isMockUnlocked(progress, nextMode)) return;
      startExam(category, nextMode, subCategory);
    };
    return <section id="review-center" className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[.07] p-4 backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-black">REVIEW CENTER</h3>
        <div className="grid w-full gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-1.5 sm:w-auto sm:grid-cols-2">
          {[["Learn", "Learn"], ["Test", "Test"]].map(([tab, label]) => <button key={tab} disabled={!hasSelection} onClick={() => hasSelection && setLearningTab(tab)} className={`min-h-11 rounded-2xl px-6 text-base font-black tracking-wide transition sm:min-w-32 ${!hasSelection ? "cursor-not-allowed bg-white/5 text-white/30" : learningTab === tab ? "bg-gradient-to-r from-emerald-300 to-cyan-300 text-slate-950 shadow-glow" : "bg-white/10 text-white/75 hover:bg-white/15"}`}>{label}</button>)}
        </div>
      </div>
      {!hasSelection && <div className="rounded-2xl bg-slate-900/45 p-5 text-center text-white/70">Select a Category and Topic/Sub-category to begin.</div>}
      {selectedCategory && !topicSelected && <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {selectedCategory.subs.map((topic) => <button key={topic} onClick={() => { setSubCategory(topic); setLearningTab("Learn"); }} className="rounded-2xl bg-slate-900/45 p-4 text-left transition hover:bg-white/10"><b>{topic}</b><p className="mt-2 text-xs text-white/45">{allQuestions.filter((q) => q.category === selectedCategory.name && q.subCategory === topic).length} questions available</p></button>)}
      </div>}
      {topicSelected && lesson && topicReview && learningTab === "Learn" && <div className="grid gap-4 lg:grid-cols-2">
        {[["Actual Lesson Content", topicReview.lessons], ["Topic Definitions", topicReview.definitions], ["Core Concepts", topicReview.concepts], ["Rules / Formulas", topicReview.rules], ["Examples", topicReview.examples], ["Worked Solutions", topicReview.worked], ["Topic-Specific Tips", topicReview.tips], ["Common Mistakes", topicReview.mistakes], ["Exam Patterns", topicReview.patterns], ["Memory Aids", topicReview.memory], ["Most Missed Questions", stats.subStats.find((s) => s.name === subCategory)?.wrong ? [`You have missed ${stats.subStats.find((s) => s.name === subCategory)?.wrong} item(s) in this topic. Use Wrong Drill until corrected.`] : [`No missed ${subCategory} questions recorded yet.`]]].map(([title, rows]) => <div key={title} className="rounded-2xl bg-slate-900/45 p-4"><h4 className="font-black">{title}</h4>{rows.map((row) => <p key={row} className="mt-2 text-sm leading-7 text-white/65">{row}</p>)}</div>)}
      </div>}
      {topicSelected && learningTab === "Test" && <div className="space-y-5">
        <div className="rounded-2xl bg-slate-900/45 p-4"><h4 className="mb-2 font-black">🔒 Mock Exam Progression</h4><p className="text-sm leading-7 text-white/65">Pass each Mock Exam to unlock the next level. Mock Exam 1 → Mock Exam 2 → Mock Exam 3 → ... → Mock Exam 10.</p><p className="mb-3 mt-2 text-sm font-bold text-emerald-100">Completed: {completedMocks} / 10 Mock Exams</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{MOCK_EXAM_MODES.map((nextMode) => {
          const unlocked = isMockUnlocked(progress, nextMode);
          return <button key={nextMode} disabled={!hasSelection || !unlocked} onClick={() => run(nextMode)} className={`min-h-12 rounded-2xl px-4 font-bold transition ${hasSelection && unlocked ? "bg-white text-slate-950 hover:scale-[1.02]" : disabledClass}`}>{!unlocked && <Lock className="mr-2 inline h-4 w-4" />}{nextMode}</button>;
        })}</div></div>
        <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-5">
          <h4 className="text-xl font-black">Full CSE Simulation</h4><p className="mt-2 text-sm text-white/70">170 questions. Actual exam experience. Final challenge. Recommended after completing Mock Exam 10.</p>
          <button disabled={!hasSelection} onClick={() => startExam("All Categories", "Full Mock Exam", "All Topics")} className={`mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-black ${hasSelection ? "bg-emerald-300 text-slate-950" : disabledClass}`}><Trophy className="h-4 w-4" />Start Full Simulation</button>
        </div>
      </div>}
    </section>;
  };

  const Dashboard = () => {
    const hasSelection = category !== "All Categories" || subCategory !== "All Topics";
    return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-6 rounded-[1.5rem] border border-emerald-200/20 bg-emerald-300/10 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-xl font-black">How to Use CSE Mastery</h2><p className="mt-2 max-w-4xl text-sm leading-7 text-white/70">Step 1: Select Category. Step 2: Select Topic. Step 3: Study in Learn Tab. Step 4: Open Test Tab. Step 5: Progress through Mock Exam 1 to Mock Exam 10. Step 6: Take the Full CSE Simulation. Use Wrong Drill from Study Tools when you need correction practice.</p></div>
          <button onClick={() => { setTourStep(0); setShowTour(true); }} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950">Open Guide</button>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <motion.section initial={false} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.08] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="mb-2 text-sm font-semibold text-emerald-200">Premium CBT mastery trainer</p><h2 className="max-w-3xl text-2xl font-black leading-tight sm:text-4xl">Master one topic at a time, then face the exam with calm precision.</h2></div>
            <Ring value={stats.accuracy} label="Accuracy" />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            {[["Readiness", `${readiness.score}%`, Target], ["XP points", progress.xp, Sparkles], ["Answered", stats.total, Check], ["Mock exams", readiness.mockCompleted, Clock]].map(([label, value, Icon]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/55 p-4"><Icon className="mb-3 h-5 w-5 text-cyan-200" /><div className="text-2xl font-black">{value}</div><div className="text-xs text-white/55">{label}</div></div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-emerald-200/40 bg-emerald-300/10 p-4 shadow-glow">
            <div className="mb-3 flex flex-wrap items-center gap-2"><Pill className="border-emerald-200/40 bg-emerald-300/20 text-emerald-50">START HERE</Pill><span className="text-sm font-bold text-emerald-100">Step 1: Select Category - Step 2: Select Topic/Sub-category - Step 3: Review Center - Learn, then Test</span></div>
            <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-black uppercase tracking-wide text-emerald-100">Step 1: Select Category
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory("All Topics"); setLearningTab("Learn"); }} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white">
                <option>All Categories</option>
                {CATEGORIES.map((cat) => <option key={cat.name}>{cat.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-emerald-100 md:col-span-2">Step 2: Select Topic/Sub-category
              <select value={subCategory} onChange={(e) => { setSubCategory(e.target.value); setLearningTab("Learn"); }} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white">
                {availableTopics.map((topic) => <option key={topic}>{topic}</option>)}
              </select>
            </label>
            </div>
          </div>
          <DynamicReviewCenter />
        </motion.section>
        <section className="rounded-[2rem] border border-white/10 bg-white/[.08] p-5 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><Lightbulb className="text-yellow-200" /> Smart recommendations</h3>
          <div className="space-y-3 text-sm text-white/75">
            <p>{stats.weakest ? `You need more practice in ${stats.weakest.name}. Current accuracy is ${stats.weakest.accuracy}%.` : "Start in the Review Center to establish your first diagnostic baseline."}</p>
            <p>{stats.strongest ? `Your strongest sub-category is ${stats.strongest.name} at ${stats.strongest.accuracy}% accuracy.` : "Your strongest category will appear after a few answered items."}</p>
            <p>{progress.sessions.length >= 2 ? `Your latest exam trend is ${progress.sessions.at(-1).accuracy - progress.sessions.at(-2).accuracy >= 0 ? "improving" : "dipping"} by ${Math.abs(progress.sessions.at(-1).accuracy - progress.sessions.at(-2).accuracy)}%.` : "Complete a timed exam to unlock improvement trend insights."}</p>
            <p>Exam Readiness Score: {readiness.score}%. Status: {readiness.status}.</p>
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-sky-400/20 p-4"><div className="text-sm text-white/60">Current rank</div><div className="text-2xl font-black">{rankInfo.current}</div><div className="mt-3 flex justify-between text-xs text-white/60"><span>Progress to {rankInfo.next}</span><span>{rankInfo.progressToNext}%</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${rankInfo.progressToNext}%` }} /></div><p className="mt-2 text-[11px] text-white/45">Score {rankInfo.score}/100 from accuracy, answered volume, mastery tests, mock exams, and readiness.</p></div>
        </section>
      </div>
      <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><Award className="text-amber-200" /> Achievements</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((badge, idx) => (
            <motion.div key={badge.title} animate={badge.earned ? { scale: [1, 1.04, 1] } : {}} transition={{ delay: idx * .08 }} className={`rounded-2xl border p-4 ${badge.earned ? "border-amber-200/40 bg-amber-300/15" : "border-white/10 bg-slate-900/45"}`}>
              <div className="mb-2 flex items-center justify-between"><b>{badge.title}</b>{badge.earned ? <Trophy className="h-5 w-5 text-amber-200" /> : <Award className="h-5 w-5 text-white/35" />}</div>
              <p className="text-xs text-white/55">{badge.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <Analytics />
    </div>
    );
  };

  const Analytics = () => {
    const subRows = CATEGORIES.flatMap((cat) => cat.subs.map((sub) => {
      const s = stats.subStats.find((row) => row.name === sub);
      return { name: sub, category: cat.short, available: allQuestions.filter((q) => q.category === cat.name && q.subCategory === sub).length, total: s?.total || 0, accuracy: s?.accuracy || 0, correct: s?.correct || 0, wrong: s?.wrong || 0 };
    }));
    return <section className="mt-8 grid gap-4 lg:grid-cols-3">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl lg:col-span-2">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><LineChart className="text-cyan-200" /> Performance Tracker</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.categoryStats.map((s) => <div key={s.name} className="rounded-2xl bg-slate-900/50 p-4"><div className="mb-2 flex justify-between text-sm"><b>{s.name}</b><span>{s.accuracy}%</span></div><div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${s.accuracy}%` }} /></div><div className="mt-2 text-xs text-white/50">{s.correct} correct • {s.wrong} wrong • {s.skipped} skipped</div></div>)}
        </div>
      </div>
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><TrendingUp className="text-emerald-200" /> Heat Map</h3>
        <p className="mb-3 text-xs leading-6 text-white/55">Each square represents your study activity and performance history. More highlighted cells indicate greater activity and mastery.</p>
        <div className="grid grid-cols-5 gap-2">
          {stats.subStats.slice(0, 25).map((s) => <div key={s.name} title={`${s.name}: ${s.accuracy}%`} className={`aspect-square rounded-xl ${s.accuracy >= 80 ? "bg-emerald-400" : s.accuracy >= 60 ? "bg-yellow-300" : "bg-red-400"}`} />)}
          {!stats.subStats.length && Array.from({ length: 25 }, (_, i) => <div key={i} className="aspect-square rounded-xl bg-white/10" />)}
        </div>
      </div>
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl lg:col-span-3">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><ListFilter className="text-cyan-200" /> Study Tools</h3>
        <div className="flex flex-wrap gap-3">
          <button disabled={category === "All Categories" && subCategory === "All Topics"} onClick={() => startExam(category, "Wrong Drill", subCategory)} className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-bold ${category !== "All Categories" || subCategory !== "All Topics" ? "bg-white text-slate-950" : "cursor-not-allowed border border-white/10 bg-white/5 text-white/35"}`}><ListFilter className="h-4 w-4" />Wrong Drill</button>
          <button onClick={resetProgress} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-red-200/30 bg-red-400/15 px-5 font-bold text-red-100 transition hover:bg-red-400/25"><RotateCcw className="h-4 w-4" />Reset Scores</button>
        </div>
        <p className="mt-3 text-xs text-white/50">Wrong Drill repeats missed items for correction. Reset Scores is kept here to avoid accidental dashboard clicks.</p>
      </div>
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl lg:col-span-3">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><BookOpen className="text-emerald-200" /> Review Library</h3>
        <div className="grid max-h-[520px] gap-3 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {subRows.map((s) => (
            <button key={`${s.category}-${s.name}`} onClick={() => { const cat = CATEGORIES.find((c) => c.short === s.category)?.name || "All Categories"; setCategory(cat); setSubCategory(s.name); setLearningTab("Learn"); }} className="rounded-2xl bg-slate-900/45 p-4 text-left transition hover:bg-white/10">
              <div className="mb-2 flex items-start justify-between gap-3"><div><b className="text-sm">{s.name}</b><div className="text-[11px] text-white/45">{s.category}</div></div><span className={`text-sm font-black ${s.accuracy >= 80 ? "text-emerald-200" : s.accuracy >= 60 ? "text-yellow-200" : "text-red-200"}`}>{masteryLevel(s.accuracy, s.total)}</span></div>
              <div className="h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${s.accuracy >= 80 ? "bg-emerald-300" : s.accuracy >= 60 ? "bg-yellow-300" : "bg-red-300"}`} style={{ width: `${s.accuracy}%` }} /></div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-white/45"><span>Available: {s.available}</span><span>Answered: {s.total}</span><span>Correct: {s.correct}</span><span>Incorrect: {s.wrong}</span><span>Accuracy: {s.accuracy}%</span><span>{masteryLevel(s.accuracy, s.total)}</span></div>
            </button>
          ))}
        </div>
      </div>
    </section>;
  };

  const Exam = () => {
    if (!exam) return null;
    const q = exam.questions[exam.index];
    const ans = exam.answers[q.id];
    const examLike = ["Timed Exam", ...MOCK_EXAM_MODES, "Full Mock Exam"].includes(mode);
    const feedbackVisible = !examLike && ans;
    const score = Object.values(exam.answers).filter((a) => a.status === "correct").length;
    useEffect(() => {
      if (!feedbackVisible || ans?.status !== "correct") return;
      const timer = setTimeout(() => {
        if (exam.index === exam.questions.length - 1) submitExam();
        else move(1);
      }, 2000);
      return () => clearTimeout(timer);
    }, [ans?.status, q.id]);
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => setScreen("dashboard")} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold"><Home className="h-4 w-4" /> Dashboard</button>
          <div className="flex flex-wrap gap-2"><Pill>{mode}</Pill><Pill><Timer className="mr-1 h-3.5 w-3.5" />{examLike ? <ExamCountdown endsAt={exam.endsAt} active={!exam.submitted} onExpire={handleExamExpired} /> : "Unlimited"}</Pill>{examLike ? <Pill>Score hidden until submit</Pill> : <Pill>Score {score}/{exam.questions.length}</Pill>}</div>
        </div>
        <div className="mb-5 h-3 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-gradient-to-r from-emerald-300 to-cyan-300" animate={{ width: `${((exam.index + 1) / exam.questions.length) * 100}%` }} /></div>
        <AnimatePresence mode="wait">
          <motion.div key={q.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="rounded-[2rem] border border-white/10 bg-white/[.08] p-5 backdrop-blur-xl sm:p-7">
            <div className="mb-4 flex flex-wrap gap-2"><Pill>Question {exam.index + 1} of {exam.questions.length}</Pill><Pill>{q.difficulty}</Pill><Pill>{q.subCategory}</Pill></div>
            <h2 className="text-xl font-black leading-relaxed sm:text-2xl">{q.question}</h2>
            <div className="mt-6 grid gap-3">
              {q.choices.map((c, idx) => {
                const selected = ans?.selected === c;
                const correct = c === q.answer;
                const show = feedbackVisible || exam.submitted;
                const cls = show && correct ? "border-emerald-300/70 bg-emerald-400/20 shadow-glow" : show && selected && !correct ? "border-red-300/70 bg-red-400/20 shadow-danger" : selected ? "border-cyan-300/80 bg-cyan-400/15" : "border-white/10 bg-slate-900/45 hover:bg-white/10";
                return <button key={c} disabled={!!ans && !examLike} onClick={() => recordAnswer(q, c)} className={`flex min-h-14 items-center justify-between rounded-2xl border p-4 text-left transition ${cls}`}><span><b className="mr-3 text-white/50">{choiceLetters[idx]}.</b>{c}</span>{show && correct && <Check className="text-emerald-200" />}{show && selected && !correct && <X className="text-red-200" />}</button>;
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => alert(q.hint)} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 font-bold"><HelpCircle className="h-4 w-4" /> Hint</button>
              <button onClick={() => toggleBookmark(q)} className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 px-5 font-bold ${progress.bookmarks?.[q.id] ? "bg-amber-300 text-slate-950" : "bg-white/10"}`}><Award className="h-4 w-4" />{progress.bookmarks?.[q.id] ? "Bookmarked" : "Bookmark"}</button>
              <button disabled={!!ans && !examLike} onClick={() => recordAnswer(q, null, "skipped")} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 font-bold disabled:opacity-40">Skip</button>
            </div>
            <AnimatePresence>
              {feedbackVisible && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-5"><h3 className="font-black">{ans.status === "correct" ? "Correct. Auto-continue in 2 seconds." : "Review Before Continuing"}</h3><p className="mt-2 text-sm leading-7 text-white/75">{q.explanation}</p><div className="mt-4 grid gap-2">{q.choices.map((choice, idx) => <p key={choice} className={`rounded-xl p-3 text-xs leading-5 ${choice === q.answer ? "bg-emerald-400/15 text-emerald-100" : ans.selected === choice ? "bg-red-400/15 text-red-100" : "bg-white/5 text-white/60"}`}>{choiceInsight(q, choice, idx)}</p>)}</div><p className="mt-3 text-sm text-emerald-100"><b>Learning tip:</b> {q.learningTip}</p>{ans.status !== "correct" && <button onClick={() => exam.index === exam.questions.length - 1 ? submitExam() : move(1)} className="mt-4 min-h-12 rounded-2xl bg-white px-5 font-black text-slate-950">Continue</button>}</motion.div>}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button onClick={() => move(-1)} disabled={exam.index === 0} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-bold text-slate-950 disabled:opacity-40"><ChevronLeft />Previous</button>
          {exam.index === exam.questions.length - 1 ? <button onClick={submitExam} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-300 px-6 font-black text-slate-950">Submit Exam</button> : <button onClick={() => move(1)} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-bold text-slate-950">Next<ChevronRight /></button>}
        </div>
      </div>
    );
  };

  const Results = () => {
    if (!exam) return null;
    const answers = Object.values(exam.answers);
    const correct = answers.filter((a) => a.status === "correct").length;
    const accuracy = pct(correct, exam.questions.length);
    const breakdown = CATEGORIES.map((c) => {
      const rows = answers.filter((a) => a.question.category === c.name);
      return { name: c.name, total: rows.length, correct: rows.filter((a) => a.status === "correct").length, accuracy: pct(rows.filter((a) => a.status === "correct").length, rows.length) };
    }).filter((x) => x.total);
    const weak = breakdown.slice().sort((a, b) => a.accuracy - b.accuracy)[0];
    return <div className="mx-auto max-w-6xl px-4 py-8"><div className="rounded-[2rem] border border-white/10 bg-white/[.08] p-7 backdrop-blur-xl"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-emerald-200">Final Results</p><h2 className="text-4xl font-black">{correct}/{exam.questions.length} • {accuracy}%</h2><p className="mt-2 text-white/65">{accuracy >= 80 ? "Passing status: Strong pass readiness" : accuracy >= 60 ? "Passing status: Near target, keep strengthening weak areas" : "Passing status: Needs focused remediation"}</p></div><Ring value={accuracy} label="Score" size={118} /></div><div className="mt-6 grid gap-3 md:grid-cols-4">{breakdown.map((b) => <div key={b.name} className="rounded-2xl bg-slate-900/55 p-4"><b>{b.name}</b><div className="mt-2 text-2xl font-black">{b.accuracy}%</div><div className="text-xs text-white/50">{b.correct}/{b.total} correct</div></div>)}</div><div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/55 p-5"><h3 className="font-black">Improvement insights</h3><p className="mt-2 text-sm text-white/70">{weak ? `Your weakest area in this exam is ${weak.name}. Suggested next category: ${weak.name}. Focus on missed explanations first, then retry Mastery Mode.` : "Complete more answers to unlock category insights."}</p></div><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => startExam(category, mode)} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 font-bold text-slate-950"><RotateCcw />Restart Exam</button><button onClick={() => setScreen("review")} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-300 px-5 font-black text-slate-950"><ListFilter />Review Answers</button><button onClick={() => startExam(weak?.name || "All Categories", "Mastery")} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 font-bold">Next Category</button></div></div></div>;
  };

  const Review = () => {
    const weakestTopics = stats.subStats.filter((s) => s.total).sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong).slice(0, 5);
    const improvedTopics = stats.subStats.map((s) => ({ ...s, trend: topicTrend(progress, s.name) })).filter((s) => s.trend > 0).sort((a, b) => b.trend - a.trend).slice(0, 5);
    const recommendedTopic = weakestTopics[0]?.name || CATEGORIES[0].subs[0];
    const recommendedCategory = CATEGORIES.find((cat) => cat.subs.includes(recommendedTopic))?.name || "All Categories";
    const strongTopics = stats.subStats.filter((s) => s.total >= 3).sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
    const savedRows = Object.entries(progress.answered || {}).map(([id, row]) => {
      const q = allQuestions.find((item) => item.id === id);
      return q ? { selected: row.selected, status: row.status, time: row.time, question: q } : null;
    }).filter(Boolean);
    const bookmarkRows = Object.keys(progress.bookmarks || {}).map((id) => {
      const q = allQuestions.find((item) => item.id === id);
      return q ? { selected: null, status: "bookmarked", time: 0, question: q } : null;
    }).filter(Boolean);
    const answerRows = exam ? exam.questions.map((q) => exam.answers[q.id] || { selected: null, status: "unanswered", time: 0, question: q }) : [...savedRows, ...bookmarkRows];
    const rows = answerRows.filter((a) => reviewFilter === "All" || (reviewFilter === "Bookmarked" ? progress.bookmarks?.[a.question.id] : a.status === reviewFilter.toLowerCase()));
    return <div className="mx-auto max-w-6xl px-4 py-8"><div className="mb-4 flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-black">Smart Review Center</h2><div className="flex flex-wrap gap-2">{["All", "Correct", "Wrong", "Skipped", "Unanswered", "Bookmarked"].map((f) => <button key={f} onClick={() => setReviewFilter(f)} className={`rounded-xl px-4 py-2 text-sm font-bold ${reviewFilter === f ? "bg-white text-slate-950" : "bg-white/10"}`}>{f}</button>)}</div></div><section className="mb-5 grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-5"><h3 className="font-black">Weakest Topics</h3>{weakestTopics.map((s) => <p key={s.name} className="mt-2 text-sm text-white/65">{s.name}: {s.accuracy}%</p>)}{!weakestTopics.length && <p className="mt-2 text-sm text-white/55">Answer more questions to unlock weak topic analysis.</p>}</div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-5"><h3 className="font-black">Most Improved Topics</h3>{improvedTopics.map((s) => <p key={s.name} className="mt-2 text-sm text-emerald-100">{s.name}: +{s.trend}%</p>)}{!improvedTopics.length && <p className="mt-2 text-sm text-white/55">Recent improvement trends appear after more attempts.</p>}</div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-5"><h3 className="font-black">Mock Exam Readiness</h3><p className="mt-2 text-sm text-white/65">Readiness Score: {readiness.score}%</p><p className="mt-2 text-sm text-white/65">Recommended next topic: {recommendedTopic}</p><p className="mt-2 text-xs text-white/45">Strong areas: {strongTopics.map((s) => s.name).join(", ") || "Not enough data yet"}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-5 lg:col-span-3"><h3 className="font-black">Daily Study Plan</h3><p className="mt-2 text-sm text-white/65">Review {recommendedTopic}, answer a Quick Review, then take a Mini Quiz. If accuracy reaches 80%, proceed to Mock Exam 1.</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => startExam(recommendedCategory, "Quick Review", recommendedTopic)} className="rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">Quick Review: 10 Questions</button><button onClick={() => startExam(recommendedCategory, "Mini Quiz", recommendedTopic)} className="rounded-2xl bg-emerald-300 px-5 py-3 font-black text-slate-950">Mini Quiz: 20 Questions</button></div></div></section><div className="space-y-4">{rows.map((a) => <div key={a.question.id} className="rounded-2xl border border-white/10 bg-white/[.07] p-5"><div className="mb-2 flex flex-wrap gap-2"><Pill>{a.status}</Pill><Pill>{a.question.category}</Pill><Pill>{a.question.subCategory}</Pill>{progress.bookmarks?.[a.question.id] && <Pill>Bookmarked</Pill>}</div><h3 className="font-black">{a.question.question}</h3><p className="mt-2 text-sm text-white/65">Your answer: <b>{a.selected || "Skipped"}</b> • Correct answer: <b className="text-emerald-200">{a.question.answer}</b></p><p className="mt-3 text-sm leading-7 text-white/70">{a.question.explanation}</p><div className="mt-3 grid gap-2">{a.question.choices.map((choice, idx) => <p key={choice} className="rounded-xl bg-white/5 p-3 text-xs text-white/60">{choiceInsight(a.question, choice, idx)}</p>)}</div><p className="mt-2 text-sm text-cyan-100"><b>Tip:</b> {a.question.learningTip}</p></div>)}</div></div>;
  };

  const Learn = () => {
    return <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 lg:grid-cols-[.35fr_.65fr]">
      <aside className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-xl font-black">Learning Modules</h2>
        <div className="max-h-[680px] space-y-2 overflow-auto pr-1">
          {TOPIC_LESSONS.map((lesson) => <button key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`w-full rounded-2xl p-3 text-left text-sm ${activeLesson.id === lesson.id ? "bg-white text-slate-950" : "bg-slate-900/55 hover:bg-white/10"}`}><b>{lesson.topic}</b><div className="text-xs opacity-65">{lesson.category}</div></button>)}
        </div>
      </aside>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-6 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-emerald-200">{activeLesson.category}</p><h2 className="text-3xl font-black">{activeLesson.topic}</h2></div><button onClick={() => { setCategory(activeLesson.category); setSubCategory(activeLesson.topic); setLearningTab("Learn"); setScreen("dashboard"); }} className="rounded-2xl bg-emerald-300 px-5 py-3 font-black text-slate-950">Open Review Center</button></div>
        {[["Topic Introduction", activeLesson.introduction], ["Detailed Explanation", activeLesson.explanation], ["Study Notes", activeLesson.notes], ["Memory Aid", activeLesson.memoryAid]].map(([title, body]) => <div key={title} className="mb-4 rounded-2xl bg-slate-900/45 p-4"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-7 text-white/70">{body}</p></div>)}
        {activeLesson.category === "Numerical Ability" && NUMERICAL_LESSON_DETAILS[activeLesson.topic] && <div className="mb-4 rounded-2xl border border-amber-200/20 bg-amber-300/10 p-5">
          <h3 className="mb-3 text-xl font-black text-amber-100">Numerical Formula Lab</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-950/50 p-4"><b>Formula Sheet</b>{NUMERICAL_LESSON_DETAILS[activeLesson.topic].formulas.map((f) => <p key={f} className="mt-2 text-sm text-white/70">{f}</p>)}</div>
            <div className="rounded-2xl bg-slate-950/50 p-4"><b>Step-by-Step Computation</b><p className="mt-2 text-sm leading-7 text-white/70">{NUMERICAL_LESSON_DETAILS[activeLesson.topic].example}</p></div>
            <div className="rounded-2xl bg-slate-950/50 p-4"><b>Shortcut Method</b><p className="mt-2 text-sm text-white/70">{NUMERICAL_LESSON_DETAILS[activeLesson.topic].shortcut}</p></div>
            <div className="rounded-2xl bg-slate-950/50 p-4"><b>Mental Math Technique</b><p className="mt-2 text-sm text-white/70">{NUMERICAL_LESSON_DETAILS[activeLesson.topic].mental}</p></div>
            <div className="rounded-2xl bg-slate-950/50 p-4 md:col-span-2"><b>Practice Drill & Formula Review Card</b><p className="mt-2 text-sm text-white/70">{NUMERICAL_LESSON_DETAILS[activeLesson.topic].drill}</p></div>
          </div>
        </div>}
        <div className="grid gap-4 md:grid-cols-2">
          {[["Examples", activeLesson.examples], ["Common Mistakes", activeLesson.commonMistakes], ["Step-by-Step Guide", activeLesson.stepGuide], ["Test-Taking Techniques", activeLesson.techniques], ["Civil Service Exam Tips", activeLesson.tips], ["Do's and Don'ts", [...activeLesson.dos.map((x) => `Do: ${x}`), ...activeLesson.donts.map((x) => `Don't: ${x}`)]]].map(([title, rows]) => <div key={title} className="rounded-2xl bg-slate-900/45 p-4"><h3 className="mb-2 font-black">{title}</h3>{rows.map((row) => <p key={row} className="mb-2 text-sm text-white/65">{row}</p>)}</div>)}
        </div>
      </section>
    </div>;
  };

  const Admin = () => {
    const bankStats = CATEGORIES.map((cat) => ({ name: cat.name, count: allQuestions.filter((q) => q.category === cat.name).length }));
    const topicStats = CATEGORIES.flatMap((cat) => cat.subs.map((sub) => ({ category: cat.short, name: sub, count: allQuestions.filter((q) => q.category === cat.name && q.subCategory === sub).length })));
    const searchedUsers = cloudUsers.filter((user) => `${user.full_name} ${user.gmail_address} ${user.status}`.toLowerCase().includes(adminSearch.toLowerCase()));
    const pendingUsers = searchedUsers.filter((user) => ["Trial Pending", "Trial Active"].includes(user.status));
    const aiDrafts = progress.aiDrafts || [];
    const aiLessons = progress.aiLessons || [];
    const aiAuditRows = contentAuditReport(allQuestions);
    const aiTopics = CATEGORIES.find((cat) => cat.name === aiStudioCategory)?.subs || [];
    if (!isAdmin) return <div className="mx-auto max-w-4xl px-4 py-10"><section className="rounded-[2rem] border border-white/10 bg-white/[.08] p-7 text-center backdrop-blur-xl"><h2 className="text-3xl font-black">Admin Access Required</h2><p className="mt-3 text-white/60">Only accounts with the Admin role can manage users, licenses, sessions, and approvals.</p></section></div>;
    return <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/[.08] p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-emerald-200">Reviewer Import System</p><h2 className="text-3xl font-black">Admin Import Module</h2><p className="mt-2 max-w-3xl text-sm text-white/60">Upload PDF, DOCX, or TXT reviewers. The app extracts text where available, detects category/topics, builds lessons/concepts, generates practice variations, and syncs imported reviewer metadata through Supabase progress storage.</p></div><label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 font-black text-slate-950"><Upload className="h-4 w-4" />{importBusy ? "Analyzing..." : "Upload Reviewers"}<input type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => importReviewers(e.target.files)} /></label></div>
        <div className="mt-6 grid gap-3 md:grid-cols-5"><div className="rounded-2xl bg-slate-900/55 p-4"><div className="text-2xl font-black">{allQuestions.length}</div><div className="text-xs text-white/50">Total Questions</div></div>{bankStats.map((s) => <div key={s.name} className="rounded-2xl bg-slate-900/55 p-4"><div className="text-2xl font-black">{s.count}</div><div className="text-xs text-white/50">{s.name}</div></div>)}</div>
        <div className="mt-5 rounded-2xl bg-slate-900/45 p-4"><h3 className="mb-3 font-black">Question Counts by Subcategory</h3><div className="grid max-h-72 gap-2 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">{topicStats.map((s) => <div key={`${s.category}-${s.name}`} className="rounded-xl bg-white/5 p-3"><div className="text-sm font-bold">{s.name}</div><div className="text-xs text-white/45">{s.category}</div><div className="mt-1 text-lg font-black">{s.count}</div></div>)}</div></div>
      </div>
      <section className="mt-5 rounded-[2rem] border border-cyan-200/20 bg-cyan-300/10 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-cyan-100">Admin Only</p><h2 className="text-3xl font-black">AI Content Studio</h2><p className="mt-2 max-w-3xl text-sm text-white/65">Generate draft questions, lessons, notes, strategies, and current-events content. Drafts are never available to students until an Admin approves and publishes them into the existing question bank or lesson library.</p></div><Pill>{aiDrafts.filter((d) => d.status === "Draft").length} question drafts</Pill></div>
        {aiStudioMessage && <div className="mt-4 rounded-2xl border border-emerald-200/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">{aiStudioMessage}</div>}
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          <label className="text-xs font-black uppercase tracking-wide text-cyan-100">Module<select value={aiStudioModule} onChange={(e) => setAiStudioModule(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm text-white">{AI_STUDIO_MODULES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-black uppercase tracking-wide text-cyan-100">Category<select value={aiStudioCategory} onChange={(e) => setAiStudioCategory(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm text-white">{CATEGORIES.map((cat) => <option key={cat.name}>{cat.name}</option>)}</select></label>
          <label className="text-xs font-black uppercase tracking-wide text-cyan-100">Topic<select value={aiStudioTopic} onChange={(e) => setAiStudioTopic(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm text-white">{aiTopics.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
          <label className="text-xs font-black uppercase tracking-wide text-cyan-100">Difficulty<select value={aiStudioDifficulty} onChange={(e) => setAiStudioDifficulty(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm text-white">{AI_DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-black uppercase tracking-wide text-cyan-100">Count<select value={aiStudioCount} onChange={(e) => setAiStudioCount(Number(e.target.value))} className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm text-white">{AI_COUNTS.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3"><button onClick={generateAiStudioDrafts} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950">Generate Draft Content</button><button onClick={() => setAiStudioModule("AI Content Audit")} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold">Open Content Audit</button></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl bg-slate-950/45 p-4"><h3 className="mb-3 font-black">Draft Question Review Queue</h3><div className="max-h-[520px] space-y-3 overflow-auto pr-1">{!aiDrafts.length && <p className="text-sm text-white/55">No AI question drafts yet.</p>}{aiDrafts.map((draft) => <div key={draft.draftId} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-2 flex flex-wrap gap-2"><Pill>{draft.status}</Pill><Pill>{draft.category}</Pill><Pill>{draft.subCategory}</Pill><Pill>{draft.difficulty}</Pill></div><h4 className="font-black">{draft.question}</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{draft.choices.map((choice, idx) => <p key={`${draft.draftId}-${choice}`} className={`rounded-xl p-3 text-xs ${choice === draft.answer ? "bg-emerald-300/15 text-emerald-100" : "bg-slate-900/70 text-white/65"}`}>{choiceLetters[idx]}. {choice}</p>)}</div><p className="mt-3 text-sm leading-6 text-white/65">{draft.explanation}</p><p className="mt-2 text-xs text-amber-100">Audit: {draft.audit?.notes} {draft.audit?.duplicateQuestions?.length ? `Matches: ${draft.audit.duplicateQuestions.join(", ")}` : ""}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => approveAiQuestion(draft)} disabled={draft.status === "Approved"} className="rounded-xl bg-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-40">Approve & Publish</button><button onClick={() => editAiDraft(draft.draftId)} className="rounded-xl bg-cyan-400/20 px-3 py-2 text-xs font-bold text-cyan-100">Edit</button><button onClick={() => updateAiDraftStatus(draft.draftId, "Rejected")} className="rounded-xl bg-red-400/20 px-3 py-2 text-xs font-bold text-red-100">Reject</button><button onClick={() => updateAiDraftStatus(draft.draftId, "Archived")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Archive</button></div></div>)}</div></div>
          <div className="space-y-4"><div className="rounded-2xl bg-slate-950/45 p-4"><h3 className="mb-3 font-black">Lesson / Notes Drafts</h3><div className="max-h-64 space-y-3 overflow-auto pr-1">{!aiLessons.length && <p className="text-sm text-white/55">No AI lesson drafts yet.</p>}{aiLessons.map((draft) => <div key={draft.id} className="rounded-2xl bg-white/5 p-4"><div className="flex flex-wrap gap-2"><Pill>{draft.status}</Pill><Pill>{draft.topic}</Pill></div><p className="mt-2 text-sm text-white/65">{draft.content.lessonContent?.[0]}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => approveAiLesson(draft)} disabled={draft.status === "Approved"} className="rounded-xl bg-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-40">Approve Lesson</button><button onClick={() => updateAiDraftStatus(draft.id, "Archived")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Archive</button></div></div>)}</div></div><div className="rounded-2xl bg-slate-950/45 p-4"><h3 className="mb-3 font-black">Content Audit</h3><div className="max-h-72 space-y-2 overflow-auto pr-1">{aiAuditRows.slice().sort((a, b) => a.questions - b.questions).slice(0, 12).map((row) => <div key={`${row.category}-${row.topic}`} className="rounded-xl bg-white/5 p-3 text-sm"><b>{row.topic}</b><p className="text-xs text-white/50">{row.category} - {row.questions} questions - supports about {row.mockCapacity} full topic mock sets</p>{row.repeated.length > 0 && <p className="mt-1 text-xs text-amber-100">Repeated distractor watch: {row.repeated.map(([text, count]) => `${text} (${count})`).join("; ")}</p>}</div>)}</div></div><div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4"><h3 className="font-black">Future Automation Plan</h3><p className="mt-2 text-sm leading-6 text-white/70">Suggested scheduled job: every Sunday, generate 20 Current Events, 20 Government, 20 Constitution, and 20 Logic drafts. Keep them in Draft status until Admin approval.</p></div></div>
        </div>
      </section>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-amber-200/20 bg-amber-300/10 p-5 backdrop-blur-xl lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-xl font-black">Admin Approval Dashboard</h3><p className="mt-1 text-sm text-white/60">Review recently registered users, approve access, reject suspicious accounts, and monitor founding member slots.</p></div><input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Search user" className="min-h-11 rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-slate-950/45 p-4"><div className="text-2xl font-black">{pendingUsers.length}</div><div className="text-xs text-white/50">Pending / Trial Users</div></div><div className="rounded-2xl bg-slate-950/45 p-4"><div className="text-2xl font-black">{foundingMembers.length}</div><div className="text-xs text-white/50">Founding Members</div></div><div className="rounded-2xl bg-slate-950/45 p-4"><div className="text-2xl font-black">{remainingFoundingSlots}</div><div className="text-xs text-white/50">Remaining Slots</div></div><div className="rounded-2xl bg-slate-950/45 p-4"><div className="text-2xl font-black">{FOUNDING_MEMBER_LIMIT}</div><div className="text-xs text-white/50">Founding Slot Limit</div></div></div>
          <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">{pendingUsers.map((u) => <div key={`approval-${u.user_id}`} className="rounded-2xl bg-slate-950/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{u.full_name}</b><p className="text-xs text-white/50">{u.gmail_address} • {u.status} • Registered {new Date(u.registration_date).toLocaleDateString()}</p></div><div className="flex gap-2"><button onClick={() => updateUserStatus(u.user_id, "Approved")} className="rounded-xl bg-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-100">Approve</button><button onClick={() => updateUserStatus(u.user_id, "Suspended")} className="rounded-xl bg-red-400/20 px-3 py-2 text-xs font-bold text-red-100">Reject</button></div></div></div>)}{!pendingUsers.length && <p className="text-sm text-white/55">No pending or trial users match the current search.</p>}</div>
          <div className="mt-4 rounded-2xl bg-slate-950/45 p-4"><h4 className="font-black">Founding Member List</h4><p className="mt-2 text-sm text-white/60">{foundingMembers.map((u) => u.gmail_address).join(", ") || "No approved founding members yet."}</p></div>
        </section>
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl"><h3 className="mb-3 text-lg font-black">Built-In Reviewer Catalog</h3><div className="space-y-2">{BUILT_IN_REVIEWERS.map((name) => <div key={name} className="rounded-2xl bg-slate-900/45 p-3 text-sm text-white/70">{name}</div>)}</div></section>
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl">
          <h3 className="mb-3 text-lg font-black">Imported Files</h3>
          {importMessage && <div className="mb-3 rounded-2xl border border-emerald-200/25 bg-emerald-300/10 p-3 text-sm text-emerald-100">{importMessage}</div>}
          <div className="space-y-3">
            {!(progress.imports || []).length && <p className="text-sm text-white/55">No uploaded files yet. Your local reviewer ZIPs are cataloged above; upload PDFs/DOCX/TXT here to expand the active bank.</p>}
            {(progress.imports || []).map((item) => {
              const generatedCount = generatedFromImport(item, Math.max(80, ((item.topics || []).length || 4) * 50)).length;
              return <div key={item.id} className="rounded-2xl bg-slate-900/45 p-4">
                <div className="flex justify-between gap-3"><b>{item.name}</b><Pill>{item.category}</Pill></div>
                <p className="mt-2 text-xs text-white/50">{(item.topics || []).length ? item.topics.join(", ") : "General concepts detected"} - {generatedCount} generated questions</p>
                <div className="mt-3 text-xs text-white/55">{(item.concepts || []).slice(0, 3).map((c) => <p key={c}>- {c}</p>)}</div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button onClick={() => publishImportedReviewer(item)} disabled={importBusy || item.publishedAt} className="rounded-xl bg-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-40">{item.publishedAt ? "Transferred to Bank" : "Approve & Transfer to Bank"}</button>
                  {item.publishedAt && <Pill>{item.publishedCount || generatedCount} approved</Pill>}
                </div>
              </div>;
            })}
          </div>
        </section>
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[.07] p-5 backdrop-blur-xl lg:col-span-2"><h3 className="mb-3 text-lg font-black">Admin: Users, Licenses, Active Sessions</h3>{adminMessage && <div className="mb-3 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-3 text-sm text-amber-100">{adminMessage}</div>}<div className="grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-slate-900/45 p-4"><div className="text-2xl font-black">{cloudUsers.length}</div><div className="text-xs text-white/50">Registered Users</div></div><div className="rounded-2xl bg-slate-900/45 p-4"><div className="text-2xl font-black">{cloudUsers.filter((u) => u.status === "Approved").length}</div><div className="text-xs text-white/50">Approved Licenses</div></div><div className="rounded-2xl bg-slate-900/45 p-4"><div className="text-2xl font-black">{cloudUsers.reduce((sum, u) => sum + (u.device_sessions?.length || 0), 0)}</div><div className="text-xs text-white/50">Tracked Devices</div></div><div className="rounded-2xl bg-slate-900/45 p-4"><div className="text-2xl font-black">Future</div><div className="text-xs text-white/50">Revenue Tracking</div></div></div><div className="mt-4 space-y-3">{!searchedUsers.length && <p className="text-sm text-white/55">No Gmail accounts match the current search.</p>}{searchedUsers.map((u) => <div key={u.user_id} className="rounded-2xl bg-slate-900/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{u.full_name}</b><p className="text-xs text-white/50">{u.gmail_address} • Registered {new Date(u.registration_date).toLocaleDateString()} • Last login {u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}</p></div><div className="flex flex-wrap gap-2"><Pill>{u.status}</Pill><button onClick={() => updateUserStatus(u.user_id, "Approved")} className="rounded-xl bg-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-100">Approve</button><button onClick={() => extendTrial(u.user_id)} className="rounded-xl bg-cyan-400/20 px-3 py-2 text-xs font-bold text-cyan-100">Extend Trial</button><button onClick={() => updateUserStatus(u.user_id, "Suspended")} className="rounded-xl bg-red-400/20 px-3 py-2 text-xs font-bold text-red-100">Suspend</button><button onClick={() => updateUserStatus(u.user_id, "Expired")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Revoke</button></div></div><div className="mt-3 grid gap-2 md:grid-cols-2">{(u.device_sessions || []).map((d) => <div key={d.id} className="rounded-xl bg-white/5 p-3 text-xs text-white/60">{d.device_info}<br />Last: {new Date(d.last_login).toLocaleString()}<br />Active: {d.active ? "Yes" : "No"}</div>)}</div><div className="mt-3 max-h-28 overflow-auto text-xs text-white/50">{(u.login_history || []).slice(0, 5).map((h) => <p key={h.id}>{new Date(h.created_at).toLocaleString()} • {h.device_info} • {h.action}</p>)}</div></div>)}</div></section>
      </div>
    </div>;
  };

  const Account = () => {
    return <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/[.08] p-6 backdrop-blur-xl">
        <p className="text-emerald-200">Supabase Authentication</p>
        <h2 className="text-3xl font-black">Gmail Account & Licensing</h2>
        <p className="mt-2 text-sm text-white/60">Sign in with Google/Gmail. Your profile, trial status, device sessions, bookmarks, analytics, and progress sync through Supabase across desktop, laptop, and mobile.</p>
        {accessMessage && <div className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-4 text-sm text-amber-100">{accessMessage}</div>}
        {!profile ? <div className="mt-6">
          <button onClick={gmailLogin} disabled={!supabaseConfigured} className="min-h-12 rounded-2xl bg-white px-5 font-black text-slate-950 disabled:opacity-50">Continue with Gmail</button>
          {!supabaseConfigured && <p className="mt-3 text-sm text-red-100">Cloud auth is disabled until `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</p>}
        </div> : <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-900/55 p-5"><h3 className="text-xl font-black">{profile.full_name}</h3><p className="text-sm text-white/60">{profile.gmail_address}</p><div className="mt-3 flex flex-wrap gap-2"><Pill>Status: {profile.status}</Pill><Pill>Role: {profile.role}</Pill><Pill>Registered: {new Date(profile.registration_date).toLocaleDateString()}</Pill><Pill>Max devices: {MAX_ACTIVE_DEVICES}</Pill>{profile.status === "Trial Active" && <TrialCountdown expiresAt={profile.trial_expires_at} userId={profile.user_id} onExpired={handleTrialExpired} prefix="Trial remaining:" />}</div></div>
          <div className="grid gap-3 md:grid-cols-2">{deviceSessions.map((d) => <div key={d.id} className="rounded-2xl bg-slate-900/45 p-4"><b>{d.device_info}</b><p className="text-xs text-white/50">Last login: {new Date(d.last_login).toLocaleString()}</p><p className="text-xs text-white/50">Active: {d.active ? "Yes" : "No"}</p></div>)}</div>
          <div className="rounded-2xl bg-slate-900/45 p-4"><h3 className="mb-2 font-black">Login History</h3>{loginHistory.map((h) => <p key={h.id} className="text-sm text-white/60">{new Date(h.created_at).toLocaleString()} • {h.device_info} • {h.action}</p>)}</div>
          <button onClick={logoutAccount} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold">Logout</button>
        </div>}
      </section>
    </div>;
  };

  const AccessLocked = () => {
    return <div className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/[.08] p-7 text-center backdrop-blur-xl">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-emerald-200" />
        <h2 className="text-3xl font-black">Cloud Access Required</h2>
        {accessMessage && <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-200/30 bg-amber-300/10 p-4 text-sm text-amber-100">{accessMessage}</div>}
        <p className="mx-auto mt-3 max-w-2xl text-white/65">{profile?.status === "Expired" ? "Your trial access has ended. Please contact the administrator for full access." : profile?.status === "Suspended" ? "Your account is suspended. Please contact the administrator." : "Please sign in with Gmail. New users receive a 60-minute trial. Approved users receive unlimited access."}</p>
        {profile?.status === "Expired" && (
          <div className="mx-auto mt-6 max-w-xl rounded-3xl border border-red-200/25 bg-slate-950/55 p-6 text-left">
            <h3 className="text-2xl font-black text-red-100">🚫 Trial Expired</h3>
            <p className="mt-2 text-white/70">Your free trial has ended.</p>
            <div className="mt-5 rounded-2xl border border-amber-200/25 bg-amber-300/10 p-5 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-amber-100">Civil Service Exam Mastery</p>
              <p className="mt-1 text-4xl font-black text-white">PHP 150</p>
              <p className="mt-1 text-sm text-amber-100">1 Year Access</p>
              <p className="mt-2 text-xs text-white/65">Affordable Civil Service Exam preparation for one full year.</p>
            </div>
            <div className="mt-5 space-y-2 text-sm text-white/75">
              <p className="font-black text-white">Unlock:</p>
              <p>✅ Full Reviewer Access</p>
              <p>✅ Unlimited Mock Exams</p>
              <p>✅ Progress Tracking</p>
              <p>✅ Cloud Save</p>
              <p>✅ Future Updates</p>
            </div>
            <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-white/75">
              <p>To activate your account, contact:</p>
              <p className="mt-1 text-lg font-black text-emerald-100">📱 Viber: 0930-197-7614</p>
              <p className="mt-3">After payment verification, your account will be upgraded to Approved status.</p>
            </div>
          </div>
        )}
        <button onClick={() => setScreen("account")} className="mt-6 rounded-2xl bg-white px-5 py-3 font-black text-slate-950">Go to Gmail Login</button>
      </section>
    </div>;
  };

  const Tour = () => {
    const steps = [
      ["Welcome", "CSE Mastery is organized like a review center: learn first, test second, then simulate the real exam."],
      ["Select Category", "Choose Verbal, Numerical, Analytical, or General Information from the dashboard selector."],
      ["Select Topic", "Pick an exact topic such as Vocabulary, Percentages, Logic, or RA 6713."],
      ["Open Learn Tab", "Read lessons, notes, strategies, tips, memory techniques, and practice examples."],
      ["Open Test Tab", "Use the Test tab when you are ready to begin Mock Exam progression."],
      ["View Performance Tracker", "Use the tracker and heat map to see weak areas and study activity."],
      ["Start First Mock Exam", "Begin with Mock Exam 1 and unlock the next mock after passing the previous one."]
    ];
    const [title, body] = steps[tourStep] || steps[0];
    return <AnimatePresence>{showTour && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm"><motion.div initial={{ y: 18, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: .98 }} className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl"><p className="text-sm font-bold text-emerald-200">Getting Started Guide</p><h3 className="mt-2 text-3xl font-black">{title}</h3><p className="mt-3 leading-7 text-white/70">{body}</p><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${((tourStep + 1) / steps.length) * 100}%` }} /></div><div className="mt-5 flex flex-wrap justify-between gap-3"><button onClick={completeTour} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold">Skip</button><div className="flex gap-2"><button disabled={tourStep === 0} onClick={() => setTourStep((s) => Math.max(0, s - 1))} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold disabled:opacity-40">Previous</button>{tourStep === steps.length - 1 ? <button onClick={completeTour} className="rounded-2xl bg-emerald-300 px-5 py-3 font-black text-slate-950">Finish</button> : <button onClick={() => setTourStep((s) => Math.min(steps.length - 1, s + 1))} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950">Next</button>}</div></div></motion.div></motion.div>}</AnimatePresence>;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,.22),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(244,114,182,.16),transparent_28%),linear-gradient(135deg,#06131f,#101827_45%,#11130f)] text-white">
      <Header />
      {cloudLoading && <div className="mx-auto max-w-4xl px-4 py-10 text-center text-white/70">Loading cloud profile...</div>}
      {!cloudLoading && !hasAccess && screen !== "account" && <AccessLocked />}
      {!cloudLoading && (hasAccess || screen === "account") && screen === "dashboard" && <Dashboard />}
      {!cloudLoading && hasAccess && screen === "exam" && <Exam />}
      {!cloudLoading && hasAccess && screen === "results" && <Results />}
      {!cloudLoading && hasAccess && screen === "review" && <Review />}
      {!cloudLoading && hasAccess && screen === "learn" && <Learn />}
      {!cloudLoading && hasAccess && screen === "admin" && <Admin />}
      {screen === "account" && <Account />}
      <Tour />
    </div>
  );
}






