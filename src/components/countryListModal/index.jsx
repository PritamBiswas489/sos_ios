import React, { useState } from 'react';
import { View, Text, Modal, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { countries } from '../../config/countries';

export const getFlagEmoji = (countryCode) => {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const CountryListModal = ({ visible, onSelectCountry, onClose }) => {
  const [searchText, setSearchText] = useState('');

  const filteredCountries = countries.filter((country) => {
    const searchLowerCase = searchText.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchLowerCase) ||
      country.code.toLowerCase().includes(searchLowerCase) ||
      country.dial_code.includes(searchText)
    );
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => onSelectCountry(item)}>
      <Text style={{color:'#fff'}}>{getFlagEmoji(item.code)} {`${item.name} (${item.dial_code})`}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Select Country</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by country name, code, or phone code"
          placeholderTextColor={'#888'}
          value={searchText}
          onChangeText={setSearchText}
        />
        <FlatList
          data={filteredCountries}
          renderItem={renderItem}
          keyExtractor={(item) => item.code}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 16,
    color: '#ff3b5c',
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    marginBottom: 20,
    color: '#fff',
    backgroundColor: '#1a1a1a',
  },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
});

export default CountryListModal;
