import { FaDotCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import styles from './NetworkSelector.module.css';
import DropdownMenu2 from '../../../../components/Global/DropdownMenu2/DropdownMenu2';
import { ItemEnterAnimation } from '../../../../utils/others/FramerMotionAnimations';
import { ambientChains } from '../../../../utils/data/chains';
import { useSwitchNetwork } from 'wagmi';

interface NetworkSelectorPropsIF {
    chainId: string;
}

export default function NetworkSelector(props: NetworkSelectorPropsIF) {
    const { chainId } = props;

    const { switchNetwork } = useSwitchNetwork();

    const chains = ambientChains.map((chain: string) => lookupChain(chain));

    const networkMenuContent = (
        <ul className={styles.menu_content}>
            {chains.map((chain, idx) => (
                <motion.li
                    onClick={() =>
                        switchNetwork
                            ? switchNetwork(parseInt(chain.chainId))
                            : null
                    }
                    key={chain.chainId}
                    className={styles.network_item}
                    custom={idx}
                    variants={ItemEnterAnimation}
                >
                    <div className={styles.chain_name_status}>
                        {lookupChain(chainId).displayName}
                        {chain.chainId == chainId && (
                            <FaDotCircle color='#CDC1FF' size={10} />
                        )}
                    </div>
                </motion.li>
            ))}
        </ul>
    );

    return (
        <>
            <div className={styles.selector_select_container}>
                <div className={styles.dropdown_menu_container}>
                    <DropdownMenu2
                        marginTop={'50px'}
                        titleWidth={'80px'}
                        title={lookupChain(chainId).displayName}
                    >
                        {networkMenuContent}
                    </DropdownMenu2>
                </div>
            </div>
        </>
    );
}
