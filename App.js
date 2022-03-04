import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { CLEAR, colors, colorsToEmoji, ENTER } from "./src/constants";
import Keyboard from "./src/components/Keyboard";
import { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";

const NUMBER_OF_TRIES = 6;

const copyArray = (arr) => {
  return [...arr.map((rows) => [...rows])];
};

const getDayOfTheYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return day;
};
const dayOfTheYear = getDayOfTheYear();
const words = ["hello", "world"];

export default function App() {
  const word = words[dayOfTheYear];
  const letters = word.split("");
  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState("playing");

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  const shareScore = () => {
    const textMap = rows
      .map((row, i) =>
        row.map((cell, j) => colorsToEmoji[getCellBGColor(cell, i, j)]).join("")
      )
      .filter((row) => row)
      .join("\n");
    const textToShare = `Wordle \n${textMap}`;
    Clipboard.setString(textToShare);
    Alert.alert(
      "Copied successfully",
      "Share your score on your social media."
    );
  };

  const checkGameState = () => {
    if (checkIfWon() && gameState !== "won") {
      Alert.alert("Huraaay", "You won!", [
        { text: "Share", onPress: shareScore },
      ]);
      setGameState("won");
    } else if (checkIfLost() && gameState !== "lost") {
      Alert.alert("Meh", "Try again tomorrow!");
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

  const greenCaps = getAllLettersWithColor(colors.primary);
  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>WORDLE</Text>
      <ScrollView style={styles.map}>
        {rows.map((row, rowIndex) => (
          <View style={styles.row} key={`row-${rowIndex}`}>
            {row.map((letter, colIndex) => (
              <View
                key={`letter-${rowIndex}-${colIndex}`}
                style={[
                  styles.cell,
                  {
                    borderColor: isCellActive(rowIndex, colIndex)
                      ? colors.lightgrey
                      : colors.darkgrey,
                    backgroundColor: getCellBGColor(letter, rowIndex, colIndex),
                  },
                ]}
              >
                <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <Keyboard
        onKeyPressed={onKeyPressed}
        greenCaps={greenCaps}
        yellowCaps={yellowCaps}
        greyCaps={greyCaps}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
  },
  title: {
    color: colors.lightgrey,
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 7,
  },
  map: {
    alignSelf: "stretch",
    marginVertical: 20,
  },
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
    // height: 40,
    justifyContent: "center",
  },
  cell: {
    borderWidth: 3,
    borderColor: colors.darkgrey,
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    maxWidth: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    color: colors.lightgrey,
    fontWeight: "bold",
    fontSize: 28,
  },
});
