import styles from './SidebarFooter.module.css';

import { Link, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { MdAccountBox } from 'react-icons/md';
// import { IoMdAnalytics } from 'react-icons/io';
import { RiSwapBoxFill } from 'react-icons/ri';
import { GiTrade } from 'react-icons/gi';
import { useUrlParams } from '../../../App/components/PageHeader/useUrlParams';
import { BsFillChatDotsFill } from 'react-icons/bs';
export default function SidebarFooter() {
    const location = useLocation();

    const currentLocation = location.pathname;
    // console.log({ currentLocation });

    const sidebarPositionStyle =
        currentLocation === '/' ? styles.position_sticky : styles.position_absolute;

    const { paramsSlug } = useUrlParams();

    const tradeDestination = location.pathname.includes('trade/market')
        ? '/trade/market'
        : location.pathname.includes('trade/limit')
        ? '/trade/limit'
        : location.pathname.includes('trade/range')
        ? '/trade/range'
        : location.pathname.includes('trade/edit')
        ? '/trade/edit'
        : '/trade/market';

    const linksData = [
        { title: 'Home', destination: '/', icon: FaHome },
        { title: 'Swap', destination: '/swap' + paramsSlug, icon: RiSwapBoxFill },
        { title: 'Trade', destination: tradeDestination + paramsSlug, icon: GiTrade },
        { title: 'Account', destination: '/account', icon: MdAccountBox },
        { title: 'Chat', destination: '/chat', icon: BsFillChatDotsFill },
    ];

    return (
        <div className={`${styles.sidebar_footer} ${sidebarPositionStyle}`}>
            {linksData.map((link) => (
                <Link to={link.destination} key={link.destination}>
                    <link.icon
                        size={18}
                        color={
                            currentLocation === link.destination
                                ? 'var(--text-highlight-dark)'
                                : 'var(--text-highlight)'
                        }
                    />
                    <p> {link.title}</p>
                </Link>
            ))}
        </div>
    );
}
