import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, colorsToEmoji } from "../../constants";
import * as Clipboard from "expo-clipboard";
import Animated, { SlideInLeft } from "react-native-reanimated";

const Number = ({ number, label }) => {
  return (
    <View style={{ alignItems: "center", margin: 10 }}>
      <Text style={styles.number}>{number}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const GuessDistributionLine = ({ position, amount, percentage }) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
      <Text style={{ color: colors.lightgrey }}>{position}</Text>
      <View
        style={{
          backgroundColor: colors.grey,
          margin: 5,
          padding: 5,
          width: `${percentage}%`,
          minWidth: 20,
        }}
      >
        <Text style={{ color: colors.lightgrey }}>{amount}</Text>
      </View>
    </View>
  );
};

const GuessDistribution = ({ distribution }) => {
  if (!distribution) {
    return null;
  }
  const sum = distribution.reduce((total, dist) => total + dist, 0);
  return (
    <>
      <Text style={styles.subtitle}>Guess Distribution</Text>
      <View
        style={{ width: "100%", padding: 20, justifyContent: "flex-start" }}
      >
        {distribution.map((dist, index) => (
          <GuessDistributionLine
            key={index}
            position={index + 1}
            amount={dist}
            percentage={(100 * dist) / sum}
          />
        ))}
      </View>
    </>
  );
};

export default function EndScreen({ won = false, rows, getCellBGColor }) {
  const share = () => {
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

  const [secondsTillTomorrow, setSecondsTillTomorrow] = useState(0);
  const [played, setPlayed] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [distributions, setDistributions] = useState(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      setSecondsTillTomorrow((tomorrow - now) / 1000);
    };
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    readState();
  }, []);

  const readState = async () => {
    const dataString = await AsyncStorage.getItem("@game");
    try {
      const data = JSON.parse(dataString);
      if (data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        setPlayed(Object.keys(data).length);
        const numberOfWins = values.filter(
          (game) => game.gameState === "won"
        ).length;
        setWinRate(Math.floor((100 * numberOfWins) / keys.length));
        let _currentStreak = 0;
        let prevDay = 0;
        const _maxStreak = 0;
        keys.forEach((key) => {
          const day = parseInt(key.split("-")[1]);
          if (data[key].gameState === "won" && _currentStreak === 0) {
            _currentStreak += 1;
          } else if (data[key].gameState === "won" && prevDay + 1 === day) {
            _currentStreak += 1;
          } else {
            if (_currentStreak > _maxStreak) {
              _maxStreak = _currentStreak;
            }
            _currentStreak = 0;
          }
          prevDay = day;
        });
        setCurrentStreak(_currentStreak);
        setMaxStreak(_maxStreak);
        // guess distributions
        const dist = [0, 0, 0, 0, 0, 0];
        values.map((game) => {
          if (game.gameState === "won") {
            const tries = game.rows.filter((row) => row[0]).length;
            dist[tries] = dist[tries] + 1;
          }
        });
        setDistributions(dist);
      }
    } catch (error) {}
  };

  const formatSeconds = () => {
    const days = Math.floor(secondsTillTomorrow / (60 * 60 * 24));
    const hours = Math.floor(secondsTillTomorrow / (60 * 60));
    const minutes = Math.floor((secondsTillTomorrow % (60 * 60)) / 60);
    const seconds = Math.floor(secondsTillTomorrow % 60);
    const string = `${hours} : ${minutes} : ${seconds}`;
    return string;
  };
  return (
    <View
      style={{ width: "100%", justifyContent: "center", alignItems: "center" }}
    >
      <Animated.Text
        entering={SlideInLeft.springify().mass(0.5)}
        style={styles.title}
      >
        {won ? "Congrats!" : "Meh, try again tomorrow"}
      </Animated.Text>
      <Animated.View entering={SlideInLeft.delay(100).springify().mass(0.5)}>
        <Text style={styles.subtitle}>Statistics</Text>
        <View style={styles.statisticsContainer}>
          <Number number={played} label={"Played"} />
          <Number number={winRate} label={"Win %"} />
          <Number number={currentStreak} label={"Current streak"} />
          <Number number={maxStreak} label={"Max streak"} />
        </View>
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.delay(200).springify().mass(0.5)}
        style={{ width: "100%" }}
      >
        <GuessDistribution distribution={distributions} />
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.delay(200).springify().mass(0.5)}
        style={{ flexDirection: "row", padding: 10 }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ color: colors.lightgrey }}>Next Wordle</Text>
          <Text
            style={{
              color: colors.lightgrey,
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {formatSeconds()}
          </Text>
        </View>
        <Pressable
          onPress={share}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.lightgrey, fontWeight: "bold" }}>
            Share
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    color: "white",
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 20,
    color: colors.lightgrey,
    textAlign: "center",
    marginVertical: 15,
    fontWeight: "bold",
  },
  statisticsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  number: {
    color: colors.lightgrey,
    fontSize: 30,
    fontWeight: "bold",
  },
  label: {
    color: colors.lightgrey,
    fontSize: 16,
    fontWeight: "bold",
  },
});
