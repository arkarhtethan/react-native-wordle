import { Text, View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Keyboard from "../Keyboard";
import { CLEAR, colors, colorsToEmoji, ENTER } from "../../constants";
import words from "../../words";
import styles from "./Game.styles";
import { getDayOfTheYear, copyArray, getDayKey } from "../../utils";
import EndScreen from "../EndScreen";
import Animated, {
  ZoomIn,
  SlideInLeft,
  FlipInEasyY,
} from "react-native-reanimated";

const NUMBER_OF_TRIES = 6;

const dayOfTheYear = getDayOfTheYear();
const dayKey = getDayKey();

const Game = () => {
  //   const word = words[dayOfTheYear];
  const word = words[0];
  const letters = word.split("");
  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState("playing");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  useEffect(() => {
    if (loaded) {
      persistState();
    }
  }, [curRow, curCol, rows, gameState]);

  useEffect(() => {
    readState();
  }, []);

  const persistState = async () => {
    const dataForToday = {
      rows,
      curRow,
      curCol,
      gameState,
    };
    try {
      let existingStateString = await AsyncStorage.getItem("@game");
      const existingState = existingStateString
        ? JSON.parse(existingStateString)
        : {};

      existingState[dayKey] = dataForToday;
      const dataString = JSON.stringify(existingState);
      await AsyncStorage.setItem("@game", dataString);
    } catch (error) {}
  };

  const readState = async () => {
    const dataString = await AsyncStorage.getItem("@game");
    try {
      const data = JSON.parse(dataString);
      if (data) {
        const day = data[dayKey];
        if (day) {
          setRows(day.rows);
          setCurCol(day.curCol);
          setCurRow(day.curRow);
          setGameState(day.gameState);
        }
      }
    } catch (error) {}
    setLoaded(true);
  };

  const checkGameState = () => {
    if (checkIfWon() && gameState !== "won") {
      setGameState("won");
    } else if (checkIfLost() && gameState !== "lost") {
      setGameState("lost");
    }
  };

  const checkIfWon = () => {
    const row = rows[curRow - 1];
    return row.every((letter, index) => letter === letters[index]);
  };

  const checkIfLost = () => {
    return !checkIfWon() && curRow === rows.length;
  };

  const onKeyPressed = (key) => {
    if (gameState !== "playing") {
      return;
    }
    const updatedrows = copyArray(rows);
    if (key === CLEAR) {
      const prevCol = curCol - 1;
      if (prevCol > -1) {
        updatedrows[curRow][prevCol] = "";
        setRows(updatedrows);
        setCurCol(prevCol);
      }
      return;
    }
    if (key === ENTER) {
      if (curCol === rows[0].length) {
        setCurRow((row) => row + 1);
        setCurCol(0);
      }
      return;
    }
    if (curCol < rows[0].length) {
      updatedrows[curRow][curCol] = key;
      setRows(updatedrows);
      // setCurRow((prevState) => prevState + 1);
      setCurCol((prevState) => prevState + 1);
    }
  };

  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  };

  const getCellBGColor = (letter, rowIndex, colIndex) => {
    if (rowIndex >= curRow) {
      return colors.black;
    }
    if (letter === letters[colIndex]) {
      return colors.primary;
    }
    if (letters.includes(letter)) {
      return colors.secondary;
    }
    return colors.darkgrey;
  };

  const getAllLettersWithColor = (color) => {
    return rows.flatMap((row, rowIndex) =>
      row.filter(
        (cell, colIndex) => getCellBGColor(cell, rowIndex, colIndex) === color
      )
    );
  };

  const getCellStyle = (letter, rowIndex, colIndex) => {
    return [
      styles.cell,
      {
        borderColor: isCellActive(rowIndex, colIndex)
          ? colors.lightgrey
          : colors.darkgrey,
        backgroundColor: getCellBGColor(letter, rowIndex, colIndex),
      },
    ];
  };

  const greenCaps = getAllLettersWithColor(colors.primary);
  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);

  if (!loaded) {
    return <ActivityIndicator />;
  }

  if (gameState !== "playing") {
    return (
      <EndScreen
        won={gameState === "won"}
        rows={rows}
        getCellBGColor={getCellBGColor}
      />
    );
  }

  return (
    <>
      <ScrollView style={styles.map}>
        {rows.map((row, rowIndex) => (
          <Animated.View
            entering={SlideInLeft.delay(rowIndex * 40)}
            style={styles.row}
            key={`row-${rowIndex}`}
          >
            {row.map((letter, colIndex) => (
              <>
                {rowIndex < curRow && (
                  <Animated.View
                    entering={FlipInEasyY.delay(colIndex * 100)}
                    key={`letter-color-${rowIndex}-${colIndex}`}
                    style={getCellStyle(letter, rowIndex, colIndex)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {rowIndex === curRow && !!letter && (
                  <Animated.View
                    entering={ZoomIn}
                    key={`letter-active-${rowIndex}-${colIndex}`}
                    style={getCellStyle(letter, rowIndex, colIndex)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {!letter && (
                  <View
                    key={`letter-${rowIndex}-${colIndex}`}
                    style={getCellStyle(letter, rowIndex, colIndex)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </View>
                )}
              </>
            ))}
          </Animated.View>
        ))}
      </ScrollView>
      <Keyboard
        onKeyPressed={onKeyPressed}
        greenCaps={greenCaps}
        yellowCaps={yellowCaps}
        greyCaps={greyCaps}
      />
    </>
  );
};

export default Game;
