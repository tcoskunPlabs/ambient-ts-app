import { useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { useAppSelector } from '../../utils/hooks/reduxToolkit';
import { TokenIF } from '../../utils/interfaces/exports';

export const useTokenSearch = (
    chainId: string,
    verifyToken: (addr: string, chn: string) => boolean,
    getTokenByAddress: (addr: string, chn: string) => TokenIF | undefined,
    getTokensByName: (searchName: string, chn: string, exact: boolean) => TokenIF[],
    defaultTokens: TokenIF[],
    walletTokens: TokenIF[],
    recentTokens: TokenIF[],
): [TokenIF[], string, Dispatch<SetStateAction<string>>, string] => {
    // TODO: debounce this input later
    // TODO: figure out if we need to update EVERYTHING to the debounced value
    // raw input from the user
    const [input, setInput] = useState<string>('');

    // search type ➜ '' or 'address' or 'nameOrAddress'
    const [searchAs, setSearchAs] = useState<string>('');

    const recentTxTokens = useAppSelector((state) => state.userData.recentTokens);

    // cleaned and validated version of raw user input
    const validatedInput = useMemo<string>(() => {
        // trim string and make it lower case
        const cleanInput = input.trim().toLowerCase();
        // action if input appears to be a contract address
        if (
            cleanInput.length === 42 ||
            (cleanInput.length === 40 && !cleanInput.startsWith('0x'))
        ) {
            setSearchAs('address');
            // if not an apparent token address, search name and symbol
            // if not an apparent token address, search name and symbol
        } else if (cleanInput.length >= 2) {
            setSearchAs('nameOrSymbol');
            return cleanInput;
            // otherwise treat as if there is no input entered
            // otherwise treat as if there is no input entered
        } else {
            setSearchAs('');
            return '';
        }
        // add '0x' to the front of the cleaned string if not present
        const fixedInput = cleanInput.startsWith('0x') ? cleanInput : '0x' + cleanInput;
        // declare an output variable
        let output = cleanInput;
        // check if string is a correctly-formed contract address
        if (
            // check if string has 42 characters
            fixedInput.length === 42 &&
            // check if string after '0x' is valid hexadecimal
            fixedInput.substring(2).match(/[0-9a-f]/g)
        ) {
            // if fixed string is valid, assign it to the output variable
            output = fixedInput;
        }
        // return output variable
        return output;
    }, [input]);

    // hook to track tokens to output and render in DOM
    const [outputTokens, setOutputTokens] = useState<TokenIF[]>([]);

    // hook to update the value of outputTokens based on user input
    useEffect(() => {
        // fn to run a token search by contract address
        function searchAsAddress(): TokenIF[] {
            // declare an output variable
            // fn will never return null, this is used for gatekeeping the return
            let foundToken: TokenIF | null = null;
            // determined whether a known token exists for user input as an address
            // this check is run against tokens listed in `allTokenLists`
            const tokenExistsOnList = verifyToken(validatedInput, chainId);
            // if token exists in an imported list, send it to the output value
            if (tokenExistsOnList) {
                // get the token for the given address and chain
                // value can be technically be undefined but gatekeeping prevents that
                foundToken = getTokenByAddress(validatedInput, chainId) as TokenIF;
                // if token is not on an imported list, check tokens in user data
                // if token is not on an imported list, check tokens in user data
            } else if (!tokenExistsOnList) {
                // retrieve and parse user data object from local storage
                // isolate tokens listed in user data
                // return one that has an address matching user input on current chain
                foundToken = JSON.parse(localStorage.getItem('user') as string).tokens.find(
                    (tkn: TokenIF) =>
                        tkn.address.toLowerCase() === validatedInput.toLowerCase() &&
                        tkn.chainId === parseInt(chainId),
                );
                foundToken = JSON.parse(localStorage.getItem('user') as string).tokens.find(
                    (tkn: TokenIF) =>
                        tkn.address.toLowerCase() === validatedInput.toLowerCase() &&
                        tkn.chainId === parseInt(chainId),
                );
            }
            // return token in an array if found, or an empty array if not
            return foundToken ? [foundToken] : [];
        }

        // fn to run a token search by name or symbol
        function searchAsNameOrSymbol(): TokenIF[] {
            // determine if the validated input is exactly two characters
            // for two-character input, app should only return exact matches
            const exactOnly = validatedInput.length === 2;
            // check tokens in `allTokenLists` for tokens that match validated input
            const foundTokens = getTokensByName(validatedInput, chainId, exactOnly);
            // get array of tokens in local storage on user data object
            // these are needed for tokens user previously imported but not on lists
            JSON.parse(localStorage.getItem('user') as string)
                .tokens // iterate over array of tokens on user data object
                .forEach((tkn: TokenIF) => {
                    // this logic runs when matches need NOT be exact
                    // if the token name or symbol INCLUDES validated input and was not
                    // ... already found on an imported list, add it to the search results
                    if (
                        !exactOnly &&
                        (tkn.name.toLowerCase().includes(validatedInput.toLowerCase()) ||
                            tkn.symbol.toLowerCase().includes(validatedInput.toLowerCase())) &&
                        tkn.chainId === parseInt(chainId) &&
                        !foundTokens
                            .map((tok: TokenIF) => tok.address.toLowerCase())
                            .includes(tkn.address.toLowerCase())
                    ) {
                        foundTokens.push(tkn);
                        // this logic runs when matches MUST be exact
                        // if the token name or symbol EQUALS validated input and was not
                        // ... already found on an imported list, add it to the search results
                    } else if (
                        exactOnly &&
                        (tkn.name.toLowerCase() === validatedInput.toLowerCase() ||
                            tkn.symbol.toLowerCase() === validatedInput.toLowerCase()) &&
                        tkn.chainId === parseInt(chainId) &&
                        !foundTokens
                            .map((tok: TokenIF) => tok.address.toLowerCase())
                            .includes(tkn.address.toLowerCase())
                    ) {
                        foundTokens.push(tkn);
                    }
                });
            // return accumulated array of matched tokens
            return foundTokens;
        }

        // fn to run if the app does not recognize input as an address or name or symbol
        function noSearch(): TokenIF[] {
            // initialize an array of tokens to output, seeded with Ambient default
            const outputTokens = defaultTokens;
            // fn to add tokens from an array to the output array
            const addTokensToOutput = (
                newTokens: TokenIF[],
                verificationNeeded: boolean,
                maxToAdd: number,
            ): void => {
                // counter to track how many tokens from array have been added
                let limiter = 0;
                // logic to iterate through all tokens in array parameter
                for (let i = 0; i < newTokens.length; i++) {
                    // check if current token at index is already in the ouput variable
                    const isInArray = outputTokens.some(
                        (tk: TokenIF) =>
                            tk.address.toLowerCase() === newTokens[i].address.toLowerCase() &&
                            tk.chainId === newTokens[i].chainId,
                    );
                    // check if token is recognized from a list (if necessary)
                    const isTokenKnown = verificationNeeded
                        ? verifyToken(
                              newTokens[i].address,
                              '0x' + newTokens[i].chainId.toString(16),
                          )
                        : true;
                    // add token to output if not already there and limiter is below max
                    if (!isInArray && isTokenKnown && limiter < maxToAdd) {
                        limiter++;
                        outputTokens.push(newTokens[i]);
                    }
                }
            };
            // add wallet tokens to output array
            addTokensToOutput(walletTokens, true, 2);
            // add tokens from recent txs to output array
            addTokensToOutput(recentTxTokens ?? [], false, 2);
            // add recent tokens to output array
            addTokensToOutput(recentTokens, false, 2);
            // remove off-chain tokens from output array
            const ouputTokensOnChain = outputTokens.filter(
                (tk: TokenIF) => tk.chainId === parseInt(chainId),
            );
            return ouputTokensOnChain;
        }

        // declare an output variable
        let tokens: TokenIF[];
        // logic router to assign search results to output based on input type
        switch (searchAs) {
            case 'address':
                tokens = searchAsAddress();
                break;
            case 'nameOrSymbol':
                tokens = searchAsNameOrSymbol();
                break;
            default:
                tokens = noSearch();
        }
        // send found tokens to local state hook
        // this will be the array of tokens returned by the hook
        setOutputTokens(tokens);

        // run hook every time the validated input from the user changes
        // will ignore changes that do not pass validation (eg adding whitespace)
    }, [chainId, defaultTokens.length, walletTokens.length, recentTokens.length, validatedInput]);

    // outputTokens ➜ tokens to display in DOM
    // validatedInput ➜ user input after validation mods
    // setInput ➜ function to update raw user input from the DOM
    // searchAs ➜ type of search the app is running
    return [outputTokens, validatedInput, setInput, searchAs];
};
