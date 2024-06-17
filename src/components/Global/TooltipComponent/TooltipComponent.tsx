import styles from './TooltipComponent.module.css';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import {
    DefaultTooltip,
    TextOnlyTooltip,
} from '../StyledTooltip/StyledTooltip';
import { memo } from 'react';

interface TooltipComponentProps {
    title: string | JSX.Element;
    noBg?: boolean;

    icon?: JSX.Element;
    placement?:
        | 'right'
        | 'bottom-end'
        | 'bottom-start'
        | 'bottom'
        | 'left-end'
        | 'left-start'
        | 'left'
        | 'right-end'
        | 'right-start'
        | 'top-end'
        | 'top-start'
        | 'top'
        | undefined;
}

function TooltipComponent(props: TooltipComponentProps) {
    if (props.noBg)
        return (
            <TextOnlyTooltip
                title={props.title}
                interactive
                placement={props.placement ? props.placement : 'right'}
                arrow
                enterDelay={400}
                leaveDelay={200}
            >
                <div className={styles.icon}>
                    {props.icon ? (
                        props.icon
                    ) : (
                        <AiOutlineQuestionCircle size={18} />
                    )}
                </div>
            </TextOnlyTooltip>
        );
    return (
        <DefaultTooltip
            title={props.title}
            interactive
            placement={props.placement ? props.placement : 'right'}
            arrow
            enterDelay={400}
            leaveDelay={200}
        >
            <div className={styles.icon}>
                {props.icon ? (
                    props.icon
                ) : (
                    <AiOutlineQuestionCircle size={15} />
                )}
            </div>
        </DefaultTooltip>
    );
}

export default memo(TooltipComponent);
