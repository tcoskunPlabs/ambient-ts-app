import { BsEmojiSmile } from 'react-icons/bs';
import { Message } from '../../Model/MessageModel';

import Picker, { IEmojiData } from 'emoji-picker-react';
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import PositionBox from '../PositionBox/PositionBox';
import styles from './MessageInput.module.css';

import { RiCloseFill, RiInformationLine } from 'react-icons/ri';
// import { AppStateContext } from '../../../../contexts/AppStateContext';
import { UserDataContext } from '../../../../contexts/UserDataContext';
import CircularProgressBar from '../../../Global/OpenOrderStatus/CircularProgressBar';
import { User, getUserLabel, userLabelForFilter } from '../../Model/UserModel';
import ReplyMessage from '../ReplyMessage/ReplyMessage';
import MentionAutoComplete from './MentionAutoComplete/MentionAutoComplete';
import { isLink, filterMessage, formatURL } from '../../ChatUtils';
import { isLinkInCrocodileLabsLinksForInput } from '../../ChatRenderUtils';

interface MessageInputProps {
    currentUser: string;
    message?: Message;
    room: string;
    ensName: string;
    appPage?: boolean;
    sendMsg: (
        currentUser: string,
        msg: string,
        room: string,
        ensName: string,
        walletID: string | null,
        mentionedName: string | null,
        mentionedWalletID: string | null,
        replyMessageContent?: string | undefined,
        repliedMessageRoomInfo?: string | undefined,
    ) => void;
    inputListener?: (e: string) => void;
    users: User[];
    isInputDisabled: boolean;
    showPopUp: boolean;
    setShowPopUp: Dispatch<SetStateAction<boolean>>;
    setPopUpText: Dispatch<SetStateAction<string>>;
    popUpText: string;
    isReplyButtonPressed: boolean;
    setIsReplyButtonPressed: Dispatch<SetStateAction<boolean>>;
    selectedMessageForReply: Message | undefined;
    setSelectedMessageForReply: Dispatch<SetStateAction<Message | undefined>>;
    sendMessageCooldown: number;
}

export default function MessageInput(props: MessageInputProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);

    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isInfoPressed, setIsInfoPressed] = useState(false);
    const { userAddress, isUserConnected } = useContext(UserDataContext);
    const [isPosition, setIsPosition] = useState(false);

    // disabled for now due to es-lint warnings
    // const {
    //     chat: { isOpen: isChatOpen },
    //     subscriptions: { isEnabled: isSubscriptionsEnabled },
    // } = useContext(AppStateContext);

    const [mentPanelActive, setMentPanelActive] = useState(false);
    const [possibleMentUser, setPossibleMentUser] = useState<User | null>(null);
    const [inputLength, setInputLength] = useState(0);
    const [mentUser, setMentUser] = useState<User | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    const roomId = props.room;

    const isRoomAdmins = roomId === 'Admins';

    const handleEmojiClick = (
        event: React.MouseEvent,
        emojiObject: IEmojiData,
    ) => {
        if (inputRef.current) {
            const emoji = emojiObject.emoji;
            const currentMessage = message;

            const selectionStart = inputRef.current.selectionStart as number;

            // Create the new message by inserting the emoji at the selection start position
            const newMessage =
                currentMessage.slice(0, selectionStart) +
                emoji +
                currentMessage.slice(selectionStart);

            if (newMessage.length <= 140) {
                setMessage(newMessage);
                setInputLength(newMessage.length);

                // Calculate the new cursor position after emoji insertion
                const newCursorPosition = selectionStart + emoji.length;

                // Update the input value and set the cursor position
                inputRef.current.value = newMessage;
                inputRef.current.setSelectionRange(
                    newCursorPosition,
                    newCursorPosition,
                );

                // Ensure the cursor remains active by focusing on the input element
                inputRef.current.focus();
            } else {
                props.setShowPopUp(true);
                props.setPopUpText(
                    'Maximum length exceeded (140 characters limit).',
                );
            }
        }
    };

    const handleEmojiPickerHideShow = () => {
        if (!isUserConnected || props.room === 'Admins') {
            setShowEmojiPicker(false);
        } else {
            setShowEmojiPicker(!showEmojiPicker);
        }
    };

    const dontShowEmojiPanel = () => {
        setShowEmojiPicker(false);
    };

    const filterUsers = (queryStr: string): User[] => {
        return props.users.filter((u) =>
            userLabelForFilter(u)
                .toLowerCase()
                .includes(queryStr.toLowerCase()),
        );
    };

    function messageInputText() {
        if (isUserConnected && userAddress) {
            return 'Type to chat. Enter to submit.';
        } else {
            return 'Please connect wallet to chat.';
        }
    }

    useEffect(() => {
        messageInputText();
    }, [isUserConnected, userAddress]);

    useEffect(() => {
        if (inputRef.current !== null && cursorPosition !== null) {
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
    }, [cursorPosition]);

    useEffect(() => {
        if (props.isReplyButtonPressed) {
            inputRef.current?.focus();
        }
    }, [props.isReplyButtonPressed]);

    const handleSendMessageButton = () => {
        if (message === '') {
            return;
        }
        const normalizedMessage = formatURL(message);
        if (
            (isLink(normalizedMessage) || filterMessage(normalizedMessage)) &&
            !isLinkInCrocodileLabsLinksForInput(normalizedMessage)
        ) {
            props.setShowPopUp(true);
            props.setPopUpText('You cannot send this link.');
        } else {
            handleSendMsg(formatURL(message), roomId);
            setMessage('');
            setMentUser(null);
            setPossibleMentUser(null);
            dontShowEmojiPanel();
            props.setShowPopUp(false);
        }
    };

    const userPickerForMention = (possibleMentUser: User) => {
        setMentUser(possibleMentUser);

        const reg = /@([^\s]*)/g;
        const newMessage = message.replace(
            reg,
            '@' + getUserLabel(possibleMentUser) + ' ',
        );
        setMessage(newMessage);
        setMentPanelActive(false);

        inputRef.current?.focus();
    };

    const handleInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const newMessage = e.currentTarget.value;
        setMessage(newMessage);
        setInputLength(newMessage.length);
        setCursorPosition(e.currentTarget.selectionStart);

        // Check if the message length is less than or equal to 140 characters,
        // and hide the pop-up message if it was shown previously
        if (newMessage.length <= 140) {
            props.setShowPopUp(false);
        }
    };

    const handleInputClick = () => {
        // Update cursor position when the user clicks inside the input field
        if (inputRef.current) {
            setCursorPosition(inputRef.current.selectionStart);
        }
    };
    const handleInputDoubleClick = () => {
        if (inputRef.current) {
            inputRef.current.select();
        }
    };

    // disabled due to es-lint warnings

    // const getEffectiveCursorPosition = () => {
    //     if (cursorPosition === null) {
    //         return null;
    //     }
    //     const currentMessage = message.slice(0, cursorPosition);
    //     const emojiCount = (currentMessage.match(/[\uD800-\uDFFF]/g) || [])
    //         .length;
    //     return cursorPosition - emojiCount;
    // };

    const isEmoji = (char: string) => {
        // You can implement a more comprehensive check for emojis
        // For simplicity, this example only checks for surrogate pairs
        return /[\uD800-\uDFFF]/.test(char);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _handleKeyDown = (e: any) => {
        if (props.isInputDisabled) {
            if (message !== '') {
                setMessage('');
            }

            return;
        }

        if (e.key === 'Enter') {
            if (
                (isLink(message) || filterMessage(message)) &&
                !isLinkInCrocodileLabsLinksForInput(message)
            ) {
                props.setShowPopUp(true);
                props.setPopUpText('You cannot send this link.');
            } else {
                // send msg if ment panel is not active
                if (!mentPanelActive) {
                    handleSendMsg(formatURL(message), roomId);
                    setMentUser(null);
                    setPossibleMentUser(null);
                    setMessage('');
                    dontShowEmojiPanel();
                    props.setShowPopUp(false);
                }
                // assign user for ment
                else {
                    if (possibleMentUser != null) {
                        userPickerForMention(possibleMentUser);
                    }
                }
            }
        } else if (
            mentPanelActive &&
            (e.key === 'ArrowUp' || e.key === 'ArrowDown')
        ) {
            e.preventDefault();
            if (possibleMentUser === null) {
                setPossibleMentUser(
                    filteredUsers[
                        e.key === 'ArrowUp' ? filteredUsers.length - 1 : 0
                    ],
                );
            } else {
                const index = filteredUsers.indexOf(possibleMentUser);
                const targetIndex = e.key === 'ArrowUp' ? index - 1 : index + 1;
                setPossibleMentUser(
                    filteredUsers[
                        targetIndex < 0
                            ? filteredUsers.length - 1
                            : targetIndex == filteredUsers.length
                            ? 0
                            : targetIndex
                    ],
                );
            }
        } else if (
            e.key !== 'Backspace' &&
            e.key !== 'ArrowRight' &&
            e.key !== 'ArrowLeft' &&
            e.target.value.length >= 140
        ) {
            props.setShowPopUp(true);
            props.setShowPopUp(true);
            props.setPopUpText(
                'Maximum length exceeded (140 characters limit).',
            );
            e.preventDefault(); // Prevent further input when the limit is reached
        } else if (e.key === 'Delete') {
            setTimeout(() => {
                setInputLength(e.target.value.length);
            });
        } else if (e.key === 'ArrowRight') {
            if (cursorPosition !== null && cursorPosition < message.length) {
                setCursorPosition((prevCursorPosition) => {
                    let newPosition = prevCursorPosition ?? +1;

                    // Check if the next character is an emoji (multi-char)
                    while (
                        newPosition < message.length &&
                        isEmoji(message.charAt(newPosition))
                    ) {
                        newPosition++;
                    }

                    return newPosition <= message.length
                        ? newPosition
                        : message.length;
                });
            }
            setInputLength(e.target.value.length);
        } else if (e.key === 'ArrowLeft') {
            if (cursorPosition !== null && cursorPosition > 0) {
                setCursorPosition((prevCursorPosition) => {
                    let newPosition = prevCursorPosition ?? -1;

                    // Check if the previous character is an emoji (multi-char)
                    while (
                        newPosition >= 0 &&
                        isEmoji(message.charAt(newPosition))
                    ) {
                        newPosition--;
                    }

                    return newPosition >= 0 ? newPosition : 0;
                });
            }
            setInputLength(e.target.value.length);
        } else {
            setInputLength(e.target.value.length);
        }
    };

    function openEmojiPanel(e: KeyboardEvent) {
        if (e.code === 'KeyC' && e.altKey) {
            setShowEmojiPicker(true);
        }
    }

    function closeEmojiPanel(e: KeyboardEvent) {
        if (e.code === 'KeyQ' && e.altKey) {
            setShowEmojiPicker(false);
        }
    }

    function openInfo(e: KeyboardEvent) {
        if (e.code === 'KeyM' && e.ctrlKey) {
            setShowEmojiPicker(true);
            setIsInfoPressed(true);
        }
    }

    useEffect(() => {
        document.body.addEventListener('keydown', openEmojiPanel);
        document.body.addEventListener('keydown', closeEmojiPanel);
        document.body.addEventListener('keydown', openInfo);

        return function cleanUp() {
            document.body.removeEventListener('keydown', openEmojiPanel);
        };
    });

    const handleSendMsg = async (msg: string, roomId: string) => {
        if (msg !== '' && userAddress) {
            if (
                (isRoomAdmins && props.selectedMessageForReply !== undefined) ||
                (props.selectedMessageForReply?.roomInfo !== 'Admins' &&
                    props.selectedMessageForReply?.roomInfo !== undefined)
            ) {
                props.sendMsg(
                    props.currentUser,
                    msg,
                    props.selectedMessageForReply?.roomInfo as string,
                    props.ensName,
                    userAddress,
                    mentUser ? userLabelForFilter(mentUser) : null,
                    mentUser ? mentUser.walletID : null,
                    props.selectedMessageForReply !== undefined
                        ? props.selectedMessageForReply?._id
                        : undefined,
                );
            } else {
                props.sendMsg(
                    props.currentUser,
                    msg,
                    roomId,
                    props.ensName,
                    userAddress,
                    mentUser ? userLabelForFilter(mentUser) : null,
                    mentUser ? mentUser.walletID : null,
                    props.selectedMessageForReply !== undefined
                        ? props.selectedMessageForReply?._id
                        : undefined,
                );
            }
            props.setIsReplyButtonPressed(false);
            props.setSelectedMessageForReply(undefined);
        }
        setInputLength(0);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onChangeMessage = async (e: any) => {
        setMessage(e.target.value);
        props.setShowPopUp(false);
        // if (e.target.value.indexOf('@') !== -1 && possibleMentUser === null) {
        if (e.target.value.indexOf('@') !== -1) {
            if (possibleMentUser === null) {
                setMentPanelActive(true);
            }
            const filteredUsers = filterUsers(e.target.value.split('@')[1]);
            setFilteredUsers(filteredUsers);
            if (filteredUsers.length < 1) {
                setPossibleMentUser(null);
                setMentPanelActive(false);
            } else {
                setMentUser(null);
            }
        } else {
            if (mentPanelActive) setMentPanelActive(false);
            setPossibleMentUser(null);
            setMentUser(null);
        }
    };

    // CHAT_FEATURES_WBO
    // Feature : Mention & AutoComplete
    const mentionAutoComplete = (
        // <></>
        <MentionAutoComplete
            userList={filteredUsers}
            active={mentPanelActive}
            selectedUser={possibleMentUser}
            userPickerForMention={userPickerForMention}
            setMentPanelActive={setMentPanelActive}
        />
    );

    return (
        <>
            {props.isInputDisabled && (
                <div className={styles.disabled_text}>
                    Message limit per minute exceeded, please wait.{' '}
                    {props.sendMessageCooldown}s
                </div>
            )}
            {!props.isInputDisabled && (
                <div
                    className={
                        !isUserConnected
                            ? styles.input_box_not_allowed
                            : styles.input_box
                    }
                >
                    <PositionBox
                        message={message}
                        isInput={true}
                        isPosition={isPosition}
                        setIsPosition={setIsPosition}
                        walletExplorer={
                            props.ensName === undefined
                                ? userAddress
                                : props.ensName
                        }
                    />
                    <>
                        {props.isReplyButtonPressed ? (
                            <ReplyMessage
                                setIsReplyButtonPressed={
                                    props.setIsReplyButtonPressed
                                }
                                isReplyButtonPressed={
                                    props.isReplyButtonPressed
                                }
                                messageObj={props.selectedMessageForReply}
                            />
                        ) : (
                            ''
                        )}
                    </>

                    <div
                        className={
                            !isUserConnected
                                ? styles.input_not_allowed
                                : styles.input
                        }
                    >
                        <input
                            type='text'
                            id='box'
                            placeholder={messageInputText()}
                            disabled={!isUserConnected || props.isInputDisabled}
                            className={
                                !isUserConnected
                                    ? styles.input_text_not_allowed
                                    : styles.input_text
                            }
                            onKeyDown={_handleKeyDown}
                            onInput={handleInputChange}
                            value={message}
                            onChange={onChangeMessage}
                            onClick={handleInputClick}
                            onDoubleClick={handleInputDoubleClick}
                            autoComplete={'off'}
                            tabIndex={-1}
                            autoFocus={
                                props.appPage || props.isReplyButtonPressed
                            }
                            maxLength={140}
                            ref={inputRef}
                        />
                        {inputLength >= 100 && (
                            <div className={styles.message_input_field}>
                                <CircularProgressBar
                                    fillPercentage={inputLength / 1.4}
                                />
                            </div>
                        )}

                        <BsEmojiSmile
                            className={
                                isUserConnected
                                    ? styles.svgButton
                                    : styles.not_LoggedIn_svgButton
                            }
                            onClick={handleEmojiPickerHideShow}
                        />
                        {}
                        <div
                            className={
                                isUserConnected
                                    ? styles.send_message_button
                                    : styles.not_LoggedIn_send_message_button
                            }
                            onClick={() => handleSendMessageButton()}
                        >
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M14.6663 1.3335L7.33301 8.66683M14.6663 1.3335L9.99967 14.6668L7.33301 8.66683M14.6663 1.3335L1.33301 6.00016L7.33301 8.66683'
                                    stroke='#EBEBFF'
                                    strokeOpacity='0.25'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    className={
                                        isUserConnected
                                            ? styles.svgButton
                                            : styles.not_LoggedIn_svgButton
                                    }
                                    id='send message button'
                                />
                                <title>Send Message</title>
                            </svg>
                        </div>
                    </div>
                    {showEmojiPicker && (
                        <div className={styles.emojiPicker}>
                            <span className={styles.emoji_close_button}>
                                <RiCloseFill
                                    size={20}
                                    title='Close Emoji Picker'
                                    onClick={() => setShowEmojiPicker(false)}
                                    id='close emoji panel button'
                                    style={{ cursor: 'pointer' }}
                                />
                            </span>
                            <span
                                className={styles.emoji_close_button}
                                onClick={() => setIsInfoPressed(!isInfoPressed)}
                                style={{ cursor: 'pointer' }}
                            >
                                <RiInformationLine title='Info' id='info' />
                            </span>
                            {isInfoPressed ? (
                                <ul>
                                    <h5>Keyboard Shortcuts</h5>
                                    <hr></hr>
                                    <li>Ctrl + Alt + C - opens/closes chat</li>
                                    <li>Esc- closes chat</li>
                                    <li>
                                        Alt + X - opens emoji panel when chat is
                                        open
                                    </li>
                                    <li>Alt+ Q - close emoji panel</li>
                                    <li>Ctrl + M - opens info</li>
                                    <li>Enter - sends message directly</li>
                                </ul>
                            ) : (
                                <Picker
                                    pickerStyle={{
                                        width: '100%',
                                        height: '89%',
                                    }}
                                    onEmojiClick={handleEmojiClick}
                                    disableSkinTonePicker={true}
                                />
                            )}
                        </div>
                    )}

                    {mentionAutoComplete}
                </div>
            )}
        </>
    );
}
