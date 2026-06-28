import React, { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	SafeAreaView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import styles from './style';
import useToast from '../../hook/useToast';
import { useUserData } from '../../hook/useUserData';
import { UserService } from '../../services/user.service';
import { getProfileImage } from '../../config/utility';
import { useDispatch } from 'react-redux';
import { resetAllState } from '../../store';
import useUserAuth from '../../hook/useUserAuth.jsx';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

const CompleteProfileScreen = ({ route }) => {
	const navigation = useNavigation();
	const dispatch = useDispatch();
	const { showError, showSuccess } = useToast();
    const {userData, fetchUserData} = useUserData();
	const { logout } = useUserAuth();
	const [profileImageUri, setProfileImageUri] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
    const [fullName, setFullName] = useState(userData?.name || '');
	const [email, setEmail] = useState(userData?.email || '');


	const canSubmit = useMemo(() => {
		return fullName.trim().length > 1 && email.trim().length > 4;
	}, [fullName, email]);

	const onPickProfileImage = () => {
		launchImageLibrary(
			{
				mediaType: 'photo',
				selectionLimit: 1,
				quality: 0.9,
			},
			response => {
				if (response.didCancel) return;
				if (response.errorCode) {
					showError('Image Upload', response.errorMessage || 'Failed to pick image');
					return;
				}
				const asset = response?.assets?.[0];
				if (Number(asset?.fileSize || 0) > MAX_PROFILE_IMAGE_SIZE) {
					showError('Image Upload', 'Please select an image up to 5 MB only.');
					return;
				}
				if (asset?.uri) {
					setProfileImageUri(asset.uri);
				}
			},
		);
	};

	const onSubmit = async () => {
		const trimmedName = fullName.trim();
		const trimmedEmail = email.trim();

		if (!trimmedName) {
			showError('Validation', 'Please enter your full name.');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmedEmail)) {
			showError('Validation', 'Please enter a valid email address.');
			return;
		}
		setIsSubmitting(true);
		try {
			const formData = new FormData();
            formData.append('name', trimmedName);
            formData.append('email', trimmedEmail);
            if (profileImageUri) {
                const fileName = profileImageUri.split('/').pop();
                const fileType = 'image/jpeg'; // Assuming JPEG, adjust if needed
                formData.append('profile_image', {
                    uri: profileImageUri,
                    name: fileName,
                    type: fileType,
                });
            }
            const response  = await new Promise((resolve, reject) => {
                UserService.updateProfile(formData, response => {
                    if (response.success) {
                        resolve(response.data);
                    }
                    else { 
                        reject(new Error(response?.error || 'Profile update failed'));
                    }
                });
            });
            
            await fetchUserData();
            setIsSubmitting(false);
            navigation.replace('Main');
			showSuccess('SUCCESS', 'Profile updated successfully.');
		} catch (error) {
            setIsSubmitting(false);
            console.log('❌ Error updating profile:', error?.message);
			showError('Update Failed', error?.message || 'Could not update profile right now.');
		} 
	};

	const initial = fullName?.trim()?.charAt(0)?.toUpperCase() || 'U';

	const onLogout = () => {
		Alert.alert('Log Out', 'Are you sure you want to log out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Log Out',
				style: 'destructive',
				onPress: async () => {
					try {
						await UserService.deleteFcmToken(() => {});
						await UserService.logout();
						dispatch(resetAllState());
						logout();
						Alert.alert('Logged Out', 'You have been logged out successfully.');
						navigation.reset({
							index: 0,
							routes: [{ name: 'Login' }],
						});
					} catch (error) {
						console.error('Logout failed:', error);
						Alert.alert('Logout Failed', 'Unable to logout. Please try again.');
					}
				},
			},
		]);
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={styles.container}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<View style={styles.header}>
					 
					<View style={styles.headerTextWrap}>
						<Text style={styles.title}>Complete Profile</Text>
						<Text style={styles.subtitle}>SET UP YOUR ACCOUNT DETAILS</Text>
					</View>
				</View>

				<View style={styles.card}>
					<View style={styles.avatarSection}>
						<View style={styles.avatarWrap}>
							{profileImageUri ? (
								<Image source={{ uri: profileImageUri }} resizeMode="cover" style={styles.avatarImage} />
							) : userData?.profile_photo ? (
								 <Image source={{ uri: getProfileImage(userData.profile_photo) }} resizeMode="cover" style={styles.avatarImage} />
							) : (
								<Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '700' }}>{initial}</Text>
							)}
						</View>
						<Text style={styles.uploadHint}>Upload Profile Image (max 5 MB)</Text>
						<TouchableOpacity style={styles.uploadButton} onPress={onPickProfileImage}>
							<Icon name="photo-camera" size={16} color="#4DA3FF" />
							<Text style={styles.uploadButtonText}>Choose from Gallery</Text>
						</TouchableOpacity>
					</View>

					<Text style={styles.label}>FULL NAME</Text>
					<View style={styles.inputBox}>
						<Icon name="person" size={18} color="#6B7C99" />
						<TextInput
							value={fullName}
							onChangeText={setFullName}
							placeholder="Enter your full name"
							placeholderTextColor="#93A4C0"
							style={styles.input}
							autoCapitalize="words"
						/>
					</View>

					<Text style={styles.label}>EMAIL ADDRESS</Text>
					<View style={styles.inputBox}>
						<Icon name="alternate-email" size={18} color="#6B7C99" />
						<TextInput
							value={email}
							onChangeText={setEmail}
							placeholder="Enter your email"
							placeholderTextColor="#93A4C0"
							style={styles.input}
							autoCapitalize="none"
							keyboardType="email-address"
						/>
					</View>

					<TouchableOpacity
						style={[styles.submitBtn, !canSubmit && { opacity: 0.6 }]}
						onPress={onSubmit}
						disabled={isSubmitting || !canSubmit}
					>
						{isSubmitting ? (
							<>
								<ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
								<Text style={styles.submitText}>Submitting...</Text>
							</>
						) : (
							<Text style={styles.submitText}>Submit Profile</Text>
						)}
					</TouchableOpacity>

					<Text style={styles.infoText}>
						This information helps keep your SOS profile accurate for trusted contacts.
					</Text>

					<TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
						<Icon name="logout" size={18} color="#FF6B6B" />
						<Text style={styles.logoutText}>Log Out</Text>
					</TouchableOpacity>
				</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

export default CompleteProfileScreen;
