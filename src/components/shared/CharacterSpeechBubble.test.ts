import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import CharacterSpeechBubble from './CharacterSpeechBubble.svelte';

describe('CharacterSpeechBubble', () => {
    it('renders a character image with speech content', () => {
        const { html } = render(CharacterSpeechBubble, {
            props: {
                imageSrc: '/assets/vera_chibi.png',
                imageAlt: 'Vera',
                message: 'Welcome to the guild.',
                speakerName: 'Vera',
                speakerTitle: 'Receptionist',
            },
        });

        expect(html).toContain('character-speech-bubble');
        expect(html).toContain('src="/assets/vera_chibi.png"');
        expect(html).toContain('alt="Vera"');
        expect(html).toContain('Welcome to the guild.');
        expect(html).toContain('Receptionist');
    });
});
