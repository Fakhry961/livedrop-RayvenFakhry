import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
export const parameters = { controls: { expanded: true } }


const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;