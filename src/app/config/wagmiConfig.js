import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia, rootstockTestnet } from 'wagmi/chains';

export const wagmi = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '8946e322a092d7ac6f43640295413c05',
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/kYDbblb6lAPtodSpZX0SZoPT8XPzqDxF'),
  },
});
