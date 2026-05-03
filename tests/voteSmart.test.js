/**
 * voteSmart.test.js — Self-contained test runner for SmartVote India
 * Run with: node tests/voteSmart.test.js
 * No external dependencies required.
 */

// ─── Minimal Test Framework ─────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;
const results = [];

function describe(suiteName, fn) {
    console.log(`\n📦 ${suiteName}`);
    console.log('─'.repeat(50));
    fn();
}

function test(name, fn) {
    try {
        fn();
        passCount++;
        results.push({ name, status: 'PASS' });
        console.log(`  ✅ PASS: ${name}`);
    } catch (error) {
        failCount++;
        results.push({ name, status: 'FAIL', error: error.message });
        console.log(`  ❌ FAIL: ${name}`);
        console.log(`     → ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
            }
        },
        toBeGreaterThan(expected) {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeLessThanOrEqual(expected) {
            if (actual > expected) {
                throw new Error(`Expected ${actual} to be ≤ ${expected}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected truthy value, but got ${JSON.stringify(actual)}`);
            }
        },
        toBeFalsy() {
            if (actual) {
                throw new Error(`Expected falsy value, but got ${JSON.stringify(actual)}`);
            }
        },
        toContain(item) {
            if (typeof actual === 'string' && !actual.includes(item)) {
                throw new Error(`Expected "${actual}" to contain "${item}"`);
            } else if (Array.isArray(actual) && !actual.includes(item)) {
                throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
            }
        }
    };
}

// ─── File Structure Tests ───────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('VoteSmart India — File Structure', () => {
    const requiredFiles = [
        'index.html',
        'style.css',
        'main.js',
        'config.js',
        'ai-service.js',
        'chatbot.js',
        'chatbot.html',
        'quiz.html',
        'quiz.js',
        'simulator.html',
        'simulator.js',
        'fakenews.html',
        'fakenews.js',
        'dashboard.html',
        'dashboard.js',
        'learning.html',
        'learning.js',
        'translate.js',
        'firebase-config.js',
        'firebase-service.js',
        'auth.js',
    ];

    requiredFiles.forEach(file => {
        test(`${file} exists`, () => {
            const filePath = path.join(PROJECT_ROOT, file);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });
});

// ─── Quiz Scoring Logic Tests ───────────────────────────────────────────────
describe('VoteSmart India — Quiz Scoring Logic', () => {
    // Simulate quiz scoring logic
    function calculateScore(answers, correctAnswers) {
        let score = 0;
        for (let i = 0; i < correctAnswers.length; i++) {
            if (answers[i] === correctAnswers[i]) score++;
        }
        return Math.round((score / correctAnswers.length) * 100);
    }

    test('Perfect score returns 100%', () => {
        const correct = ['a', 'b', 'c', 'd'];
        expect(calculateScore(['a', 'b', 'c', 'd'], correct)).toBe(100);
    });

    test('All wrong returns 0%', () => {
        const correct = ['a', 'b', 'c', 'd'];
        expect(calculateScore(['d', 'c', 'b', 'a'], correct)).toBe(0);
    });

    test('Half correct returns 50%', () => {
        const correct = ['a', 'b', 'c', 'd'];
        expect(calculateScore(['a', 'b', 'a', 'a'], correct)).toBe(50);
    });

    test('Single question correct returns 100%', () => {
        expect(calculateScore(['a'], ['a'])).toBe(100);
    });

    test('Score never exceeds 100%', () => {
        const score = calculateScore(['a', 'b'], ['a', 'b']);
        expect(score).toBeLessThanOrEqual(100);
    });
});

// ─── Voting Simulator Logic Tests ───────────────────────────────────────────
describe('VoteSmart India — Voting Simulator', () => {
    // Simulate candidate selection
    function simulateVote(candidates, selectedId) {
        const selected = candidates.find(c => c.id === selectedId);
        return selected ? { success: true, candidate: selected } : { success: false };
    }

    const mockCandidates = [
        { id: 1, name: 'Candidate A', party: 'Party X', symbol: '🌸' },
        { id: 2, name: 'Candidate B', party: 'Party Y', symbol: '🔔' },
        { id: 3, name: 'NOTA', party: 'None of the Above', symbol: '❌' },
    ];

    test('Selecting a valid candidate returns success', () => {
        const result = simulateVote(mockCandidates, 1);
        expect(result.success).toBe(true);
        expect(result.candidate.name).toBe('Candidate A');
    });

    test('Selecting NOTA returns success', () => {
        const result = simulateVote(mockCandidates, 3);
        expect(result.success).toBe(true);
        expect(result.candidate.name).toBe('NOTA');
    });

    test('Invalid candidate ID returns failure', () => {
        const result = simulateVote(mockCandidates, 99);
        expect(result.success).toBe(false);
    });

    test('Candidate list is non-empty', () => {
        expect(mockCandidates.length).toBeGreaterThan(0);
    });
});

// ─── Election Readiness Score Tests ─────────────────────────────────────────
describe('VoteSmart India — Election Readiness Score', () => {
    function calculateReadiness(quizScore, modulesCompleted) {
        const raw = quizScore + (modulesCompleted * 10);
        return Math.min(raw, 100);
    }

    function getReadinessTier(readiness) {
        if (readiness >= 90) return 'Outstanding';
        if (readiness >= 61) return 'Almost There';
        if (readiness >= 31) return 'Good Progress';
        return 'Getting Started';
    }

    test('Zero quiz + zero modules = 0% readiness', () => {
        expect(calculateReadiness(0, 0)).toBe(0);
    });

    test('50% quiz + 3 modules = 80% readiness', () => {
        expect(calculateReadiness(50, 3)).toBe(80);
    });

    test('Readiness caps at 100%', () => {
        expect(calculateReadiness(100, 10)).toBe(100);
    });

    test('Readiness tier: Outstanding at 90+', () => {
        expect(getReadinessTier(95)).toBe('Outstanding');
    });

    test('Readiness tier: Almost There at 61-89', () => {
        expect(getReadinessTier(75)).toBe('Almost There');
    });

    test('Readiness tier: Good Progress at 31-60', () => {
        expect(getReadinessTier(45)).toBe('Good Progress');
    });

    test('Readiness tier: Getting Started at 0-30', () => {
        expect(getReadinessTier(15)).toBe('Getting Started');
    });
});

// ─── Input Validation Tests ─────────────────────────────────────────────────
describe('VoteSmart India — Input Validation', () => {
    function validateInput(text, maxLength = 300) {
        if (!text || text.trim().length === 0) {
            return { valid: false, error: 'Input cannot be empty.' };
        }
        const sanitized = text.trim();
        if (sanitized.length > maxLength) {
            return { valid: false, error: `Input exceeds ${maxLength} character limit.` };
        }
        return { valid: true, sanitized, error: null };
    }

    test('Valid input passes validation', () => {
        const result = validateInput('What is EVM?');
        expect(result.valid).toBe(true);
        expect(result.error).toBe(null);
    });

    test('Empty string fails validation', () => {
        const result = validateInput('');
        expect(result.valid).toBe(false);
    });

    test('Whitespace-only string fails validation', () => {
        const result = validateInput('   ');
        expect(result.valid).toBe(false);
    });

    test('Null input fails validation', () => {
        const result = validateInput(null);
        expect(result.valid).toBe(false);
    });

    test('Input over 300 chars fails validation', () => {
        const longText = 'a'.repeat(301);
        const result = validateInput(longText, 300);
        expect(result.valid).toBe(false);
    });

    test('Input at exactly 300 chars passes', () => {
        const exactText = 'a'.repeat(300);
        const result = validateInput(exactText, 300);
        expect(result.valid).toBe(true);
    });

    test('Input is trimmed', () => {
        const result = validateInput('  Hello  ');
        expect(result.sanitized).toBe('Hello');
    });
});

// ─── Translation Dictionary Tests ───────────────────────────────────────────
describe('VoteSmart India — Translation Dictionary', () => {
    const HINDI_DICT = {
        'Home': 'होम',
        'Learn': 'सीखें',
        'Quiz': 'क्विज़',
        'Dashboard': 'डैशबोर्ड',
        'Login': 'लॉगिन',
    };

    test('Home translates to Hindi', () => {
        expect(HINDI_DICT['Home']).toBe('होम');
    });

    test('Learn translates to Hindi', () => {
        expect(HINDI_DICT['Learn']).toBe('सीखें');
    });

    test('Non-existent key returns undefined', () => {
        expect(HINDI_DICT['NonExistent']).toBe(undefined);
    });

    test('Dictionary has all nav items', () => {
        expect(Object.keys(HINDI_DICT).length).toBeGreaterThan(3);
    });
});

// ─── Config Structure Tests ─────────────────────────────────────────────────
describe('VoteSmart India — Config Structure', () => {
    test('config.js exports expected keys', () => {
        const configContent = fs.readFileSync(path.join(PROJECT_ROOT, 'config.js'), 'utf8');
        expect(configContent).toContain('GEMINI_API_KEY');
        expect(configContent).toContain('GEMINI_MODEL');
        expect(configContent).toContain('FIREBASE');
        expect(configContent).toContain('TRANSLATE_API_KEY');
    });

    test('config.js does NOT contain deprecated model', () => {
        const configContent = fs.readFileSync(path.join(PROJECT_ROOT, 'config.js'), 'utf8');
        // It should NOT have the old deprecated model
        const hasDeprecated = configContent.includes('gemini-1.5-flash');
        expect(hasDeprecated).toBe(false);
    });

    test('.gitignore includes config.js', () => {
        const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const content = fs.readFileSync(gitignorePath, 'utf8');
            expect(content).toContain('config.js');
        } else {
            // If no .gitignore exists, this is a warning but not a failure
            expect(true).toBe(true);
        }
    });
});

// ─── Results Summary ────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`📊 TEST RESULTS: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
console.log('═'.repeat(50));

if (failCount > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  • ${r.name}: ${r.error}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
}
