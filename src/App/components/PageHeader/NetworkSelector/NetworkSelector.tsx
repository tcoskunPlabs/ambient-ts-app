// START: Import React and Dongles
import { Dispatch, SetStateAction, useState } from 'react';
import { FaDotCircle } from 'react-icons/fa';
import { AnimateSharedLayout, motion } from 'framer-motion';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

// START: Import Local Files
import styles from './NetworkSelector.module.css';
import DropdownMenu2 from '../../../../components/Global/DropdownMenu2/DropdownMenu2';
import { ItemEnterAnimation } from '../../../../utils/others/FramerMotionAnimations';
import { ambientChains } from '../../../../utils/data/chains';
import IconWithTooltip from '../../../../components/Global/IconWithTooltip/IconWithTooltip';

interface NetworkSelectorPropsIF {
    chainId: string;
    switchChain: Dispatch<SetStateAction<string>>;
}

interface NetworkItemPropsIF {
    color: string;
    isSelected: boolean;
    name: string;
    onClick: () => void;
}

export default function NetworkSelector(props: NetworkSelectorPropsIF) {
    const { chainId, switchChain } = props;

    const chains = ambientChains.map((chain: string) => lookupChain(chain));

    const networkMenuContent = (
        <ul className={styles.menu_content}>
            {chains.map((chain, idx) => (
                <motion.li
                    onClick={() => switchChain(chain.chainId)}
                    key={chain.chainId}
                    className={styles.network_item}
                    custom={idx}
                    variants={ItemEnterAnimation}
                >
                    <div className={styles.chain_name_status}>
                        {lookupChain(chainId).displayName}
                        {chain.chainId == chainId && <FaDotCircle color='#CDC1FF' size={10} />}
                    </div>
                </motion.li>
            ))}
        </ul>
    );

    // NEW DROPDOWN TO BE IMPLEMENTED ONCE WE HAVE MULTIPLE NETWORKS
    //  CURRENTLY NOT IN USE-------
    // todo: PLEASE DON'T DELETE THIS
    function NetworkItem(props: NetworkItemPropsIF) {
        const { color, isSelected, onClick, name } = props;

        return (
            <motion.li className={styles.network_item_container} onClick={onClick} variants={item}>
                {name}
                <div className={styles.network_color} style={{ backgroundColor: color }}>
                    {isSelected && (
                        <motion.div
                            layoutId='outline'
                            className={styles.outline}
                            initial={false}
                            animate={{ borderColor: color }}
                            transition={spring}
                        />
                    )}
                </div>
            </motion.li>
        );
    }
    const [showDropdown, setShowDropdown] = useState(false);

    const networkItems = [
        {
            name: 'Network1',
            color: '#ff0055',
        },
        {
            name: 'Network2',
            color: '#0099ff',
        },
        {
            name: 'Network3',
            color: '#22cc88',
        },
        {
            name: 'Network4',
            color: '#ffaa00',
        },
        {
            name: 'Network5',
            color: 'yellow',
        },
    ];
    const [selected, setSelected] = useState(networkItems[0]);
    const dropdownMenu = (
        <motion.div
            className={styles.dropdown_menu}
            layout
            initial={{ opacity: 0, height: 0, scale: 0.8 }}
            animate={{ opacity: 1, height: '300px', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0 }}
            transition={{
                duration: 0.2,
                ease: 'easeInOut',
            }}
        >
            {networkItems.map((network, idx) => (
                <NetworkItem
                    name={network.name}
                    color={network.color}
                    key={idx}
                    isSelected={selected.color === network.color}
                    onClick={() => setSelected(network)}
                />
            ))}
        </motion.div>
    );

    const newDropdown = (
        <motion.div className={styles.main_container}>
            <div className={styles.clicker} onClick={() => setShowDropdown(!showDropdown)}>
                {selected.name}
                {showDropdown ? <MdKeyboardArrowUp size={25} /> : <MdKeyboardArrowDown size={25} />}
            </div>
            {showDropdown && dropdownMenu}
        </motion.div>
    );
    // ------------------------END OF NEW DROPDOWN TO BE IMPLEMENTED LATER
    return (
        <AnimateSharedLayout>
            <div className={styles.selector_select_container}>
                <IconWithTooltip title='Network' placement='left'>
                    <div className={styles.dropdown_menu_container}>
                        <DropdownMenu2
                            marginTop={'50px'}
                            titleWidth={'80px'}
                            title={lookupChain(chainId).displayName}
                        >
                            {networkMenuContent}
                        </DropdownMenu2>
                    </div>
                </IconWithTooltip>
            </div>
            {newDropdown}
        </AnimateSharedLayout>
    );
}

const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

const spring = {
    type: 'spring',
    stiffness: 500,
    damping: 30,
};
