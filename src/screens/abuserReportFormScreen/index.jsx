
import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, SafeAreaView,
    StyleSheet, StatusBar, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, Image, ActivityIndicator, FlatList
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { Colors, Typography, Spacing, Radius } from '../../components/abuserReport/theme.jsx';
import {
    FormField, StyledInput, SegmentControl,
    ToggleRow, PrimaryButton, SectionDivider,
} from '../../components/abuserReport/UIKit.jsx';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AbuseReportService } from '../../services/abuseRport.service.js';
import { useNavigation } from '@react-navigation/native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SW, SF } from '../../theme/dimensions';

const MAX_ABUSER_IMAGE_SIZE = 5 * 1024 * 1024;
const ABUSE_TYPES = ['Physical', 'Psychological', 'Sexual', 'Financial', 'Stalking', 'Other'];
const THREAT_LEVELS = ['Low', 'Medium', 'High'];
const EVIDENCE_TYPES = [
    { key: 'document', label: 'Evidence 1', subtitle: 'Primary supporting document', iconName: 'description' },
    { key: 'image', label: 'Evidence 2', subtitle: 'Additional supporting document', iconName: 'folder' },
    { key: 'video', label: 'Evidence 3', subtitle: 'Supplementary supporting document', iconName: 'attach-file' },
];

const formatFileSize = size => {
    const bytes = Number(size || 0);
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const formatMimeType = mimeType => {
    if (!mimeType) return 'Unknown type';
    return mimeType.split('/').pop()?.toUpperCase() || mimeType;
};

 

const calculateAge = dob => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age >= 0 ? String(age) : null;
};

const normalizeAbuser = item => ({
    id: String(item?.id ?? ''),
    fullName: item?.full_name || '-',
    aliasName: item?.alias_name || '-',
    gender: item?.gender || '-',
    age: calculateAge(item?.dob),
    phone: item?.phone || '-',
    address: item?.address || '-',
    avatar: item?.photo || null,
});

const INITIAL_FORM = {
    fullName: '', aliasName: '', gender: '',
    dob: '', phone: '', email: '', address: '',
    abuseType: '', incidentDate: '', incidentLocation: '',
    description: '', witnessInformation: '',
    threatLevel: 'Low',
    historyOfViolence: false, weaponAccess: false, restrainingOrder: false,
    notes: '',
};

// ── TEST DATA ────────────────────────────────────────────────────────────────
const TEST_FORM = {
    fullName: 'James Holloway',
    aliasName: 'J-Holl',
    gender: 'Male',
    dob: '1985-03-14',
    phone: '+1 555-401-7892',
    email: 'james.holloway@example.com',
    address: '47 Maplewood Drive, San Antonio, TX 78201',
    abuseType: 'Physical',
    incidentDate: '2024-11-22',
    incidentLocation: 'San Antonio, TX',
    description:
        'The subject physically assaulted the victim at the shared residence. The victim sustained bruising on arms and neck. Neighbours reported hearing loud altercations on multiple prior occasions. Subject was under the influence at the time of the incident.',
    witnessInformation:
        'Sarah Mendez (neighbour) – +1 555-310-4421\nOfficer Brett Collins – Badge #4829, SAPD',
    threatLevel: 'High',
    historyOfViolence: true,
    weaponAccess: true,
    restrainingOrder: false,
    notes:
        'Victim has expressed reluctance to press charges due to financial dependency. Follow-up welfare check scheduled for 2024-11-29. Case flagged for priority review.',
};
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportFormScreen({ onNavigateBack }) {
    const [useTestData, setUseTestData] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [abuserPickerOpen, setAbuserPickerOpen] = useState(false);
    const [abuserList, setAbuserList] = useState([]);
    const [abuserListLoading, setAbuserListLoading] = useState(false);
    const [abuserListRefreshing, setAbuserListRefreshing] = useState(false);
    const [deletingAbuserId, setDeletingAbuserId] = useState(null);
    const [selectedAbuser, setSelectedAbuser] = useState(null);
    const [abuserPhoto, setAbuserPhoto] = useState(null);
    const [evidenceFiles, setEvidenceFiles] = useState({ document: null, image: null, video: null });
    const [successModal, setSuccessModal] = useState({ visible: false, reportId: null, abuserName: '' });
    const navigation = useNavigation();

    const handleToggleTestData = () => {
        const next = !useTestData;
        setUseTestData(next);
        setForm(next ? TEST_FORM : INITIAL_FORM);
        setErrors({});
        if (next) setSelectedAbuser(null);
    };

    useEffect(() => {
      if(useTestData){
        setForm(TEST_FORM);
      }else{
        setForm(INITIAL_FORM);
      }

    },[useTestData])

    const fetchExistingAbusers = async (isRefresh = false) => {
        if (isRefresh) setAbuserListRefreshing(true);
        else setAbuserListLoading(true);

        try {
            const response = await new Promise((resolve, reject) => {
                AbuseReportService.getExistingAbuser(result => {
                    if (result.success) resolve(result.data);
                    else reject(new Error(result.error || 'Failed to fetch existing abusers'));
                });
            });

            const payload = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                    ? response
                    : [];

            setAbuserList(payload.map(normalizeAbuser).filter(item => item.id));
        } catch (error) {
            Alert.alert('Abuser List', error?.message || 'Failed to load existing abusers. Please try again.');
        } finally {
            if (isRefresh) setAbuserListRefreshing(false);
            else setAbuserListLoading(false);
        }
    };

    useEffect(() => {
        if (abuserPickerOpen && abuserList.length === 0) {
            fetchExistingAbusers();
        }
    }, [abuserPickerOpen]);

    const handleSelectAbuser = item => {
        setSelectedAbuser(item);
        setAbuserPickerOpen(false);
        setErrors(prev => ({ ...prev, fullName: null }));
    };

    const handleDeleteAbuser = item => {
        Alert.alert(
            'Delete Abuser',
            `Are you sure you want to delete ${item?.fullName || 'this abuser'}? This action cannot be undone.All report associated with this abuser will also be deleted.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingAbuserId(item.id);
                        try {
                            const response = await new Promise((resolve, reject) => {
                                AbuseReportService.deleteAbuser(item.id, result => {
                                    if (result.success) resolve(result.data);
                                    else reject(new Error(result.error || 'Failed to delete abuser'));
                                });
                            });

                            const status = response?.status;
                            if (status && status !== 200 && status !== 204) {
                                throw new Error(response?.message || 'Failed to delete abuser');
                            }

                            if (selectedAbuser?.id === item.id) {
                                setSelectedAbuser(null);
                            }

                            setAbuserList(prev => prev.filter(abuser => abuser.id !== item.id));
                            Alert.alert('Abuser List', 'Abuser deleted successfully.');
                        } catch (error) {
                            Alert.alert('Abuser List', error?.message || 'Failed to delete abuser. Please try again.');
                        } finally {
                            setDeletingAbuserId(null);
                        }
                    },
                },
            ],
        );
    };

    const set = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
    };

    const validate = () => {
        const e = {};
        if (!selectedAbuser && !form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.abuseType) e.abuseType = 'Select an abuse type';
        if (!form.incidentDate.trim()) e.incidentDate = 'Incident date is required';
        if (form.incidentDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.incidentDate.trim())) e.incidentDate = 'Incident date must be in YYYY-MM-DD format';
        if (!form.description.trim()) e.description = 'Description is required';
        if (!form.threatLevel) e.threatLevel = 'Select a threat level';
        if (form.dob && !/^\d{4}-\d{2}-\d{2}$/.test(form.dob.trim())) e.dob = 'Date of birth must be in YYYY-MM-DD format';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handlePickAbuserPhoto = () => {
        launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 }, response => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Image Upload', response.errorMessage || 'Failed to pick image'); return; }
            const asset = response?.assets?.[0];
            if (!asset?.uri) { Alert.alert('Image Upload', 'No image was selected. Please try again.'); return; }
            if (Number(asset?.fileSize || 0) > MAX_ABUSER_IMAGE_SIZE) { Alert.alert('Image Upload', 'Please select an image up to 5 MB only.'); return; }
            setAbuserPhoto({ uri: asset.uri, name: asset.fileName || form.fullName?.trim() || 'Abuser photo', type: asset.type || 'image/jpeg', fileSize: asset.fileSize || 0 });
        });
    };

    const handlePickEvidence = async type => {
        try {
            const [file] = await pick({ type: [types.allFiles] });
            if (!file?.uri) return;
            setEvidenceFiles(prev => ({ ...prev, [type]: { name: file?.name || `${type}_file`, mimeType: file?.type || 'application/octet-stream', uri: file.uri, size: file?.size || 0 } }));
        } catch (err) {
            if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) Alert.alert('File Picker', 'Could not pick a file. Please try again.');
        }
    };

    const clearEvidence = type => setEvidenceFiles(prev => ({ ...prev, [type]: null }));

    const resetForm = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        setSelectedAbuser(null);
        setAbuserPhoto(null);
        setEvidenceFiles({ document: null, image: null, video: null });
        setUseTestData(false);
    };

    const handleSubmit = async () => {
        if (!validate()) { Alert.alert('Validation Error', 'Please correct the highlighted fields before submitting.'); return; }
        setSaving(true);
        let abuserID = selectedAbuser?.id || null;
        if (!abuserID) {
            const newAbuserFormData = new FormData();
            form.fullName && newAbuserFormData.append('full_name', form.fullName);
            form.aliasName && newAbuserFormData.append('alias_name', form.aliasName);
            form.gender && newAbuserFormData.append('gender', form.gender);
            form.dob && newAbuserFormData.append('dob', form.dob);
            form.phone && newAbuserFormData.append('phone', form.phone);
            form.email && newAbuserFormData.append('email', form.email);
            form.address && newAbuserFormData.append('address', form.address);
            if (abuserPhoto) newAbuserFormData.append('photo', { uri: abuserPhoto.uri, name: abuserPhoto.name, type: abuserPhoto.type });

            const responseNewAbuser = await new Promise((resolve) => {
                AbuseReportService.registerNewAbuser(newAbuserFormData, (result) => {
                    if (result.success) resolve(result.data);
                    else Alert.alert('Error', 'Failed to register new abuser: ' + result.error);
                });
            });

            abuserID = responseNewAbuser?.id;
        }

        if (abuserID) {
            const reportFormData = new FormData();
            reportFormData.append('abuser_id', abuserID);
            form.abuseType && reportFormData.append('abuse_type', form.abuseType);
            form.incidentDate && reportFormData.append('incident_date', form.incidentDate);
            form.incidentLocation && reportFormData.append('incident_location', form.incidentLocation);
            form.description && reportFormData.append('description', form.description);
            form.witnessInformation && reportFormData.append('witness_information', form.witnessInformation);
            form.threatLevel && reportFormData.append('threat_level', form.threatLevel);
            form.historyOfViolence && reportFormData.append('history_of_violence', form.historyOfViolence);
            form.weaponAccess && reportFormData.append('weapon_access', form.weaponAccess);
            form.restrainingOrder && reportFormData.append('restraining_order', form.restrainingOrder);
            form.notes && reportFormData.append('notes', form.notes);
            Object.entries(evidenceFiles).forEach(([key, file]) => {
                if (file) reportFormData.append('evidence_files', { uri: file.uri, name: file.name, type: file.mimeType });
            });

            const responseReport = await new Promise((resolve) => {
                AbuseReportService.registerNewAbuseReport(reportFormData, (result) => {
                    if (result.success) resolve(result.data);
                    else Alert.alert('Error', 'Failed to submit abuse report: ' + result.error);
                });
            });

            if (responseReport?.id) {
                setSaving(false);
                setSuccessModal({
                    visible: true,
                    reportId: responseReport.id,
                    abuserName: selectedAbuser?.fullName || form.fullName || 'Unknown',
                });
                resetForm();
            } else {
                setSaving(false);
                Alert.alert('Error', 'Failed to submit abuse report. Please try again.');
            }
        } else {
            setSaving(false);
            Alert.alert('Error', 'Failed to register new abuser. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={appColors.DarkPrimary} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                <View style={styles.headerWrap}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.75}>
                            <Icon name="arrow-back" size={24} color={appColors.white} />
                        </TouchableOpacity>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.headerTitle}>Abuse Report</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('ReportList')} activeOpacity={0.85}>
                            <Icon name="list" size={24} color="#6B7C99" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* ── DEV: TEST DATA TOGGLE ───────────────────────────── */}
                    {/* <TouchableOpacity
                        style={[styles.testDataToggle, useTestData && styles.testDataToggleActive]}
                        onPress={handleToggleTestData}
                        activeOpacity={0.8}
                    >
                        <View style={styles.testDataToggleLeft}>
                            <View style={[styles.testDataDot, useTestData && styles.testDataDotActive]} />
                            <View>
                                <Text style={[styles.testDataToggleLabel, useTestData && styles.testDataToggleLabelActive]}>
                                    {useTestData ? 'Test Data: ON' : 'Test Data: OFF'}
                                </Text>
                                <Text style={styles.testDataToggleHint}>
                                    {useTestData ? 'Form is pre-filled with sample data' : 'Tap to pre-fill form for testing'}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.testDataPill, useTestData && styles.testDataPillActive]}>
                            <Text style={[styles.testDataPillText, useTestData && styles.testDataPillTextActive]}>
                                {useTestData ? 'ENABLED' : 'DEV'}
                            </Text>
                        </View>
                    </TouchableOpacity> */}

                    <SectionDivider title="Abuser Selection" />

                    <View style={styles.selectionCard}>
                        <Text style={styles.selectionCardTitle}>Use Existing Abuser Profile</Text>
                        <Text style={styles.selectionCardBody}>Select from existing records or create a new profile manually.</Text>
                        <View style={styles.selectionActionRow}>
                            <PrimaryButton title={selectedAbuser ? 'Change Existing Abuser' : 'Select Existing Abuser'} onPress={() => setAbuserPickerOpen(true)} style={styles.selectionPrimaryBtn} />
                            {!!selectedAbuser && <PrimaryButton title="Use New Abuser" variant="outline" onPress={() => setSelectedAbuser(null)} style={styles.selectionSecondaryBtn} />}
                        </View>
                    </View>

                    {!!selectedAbuser && (
                        <View style={styles.selectedAbuserCard}>
                            <Image source={{ uri: selectedAbuser.avatar }} style={styles.selectedAbuserAvatar} />
                            <View style={{ flex: 1 }}>
                                <View style={styles.selectedAbuserTopRow}>
                                    <Text style={styles.selectedAbuserName}>{selectedAbuser.fullName}</Text>
                                    <Text style={styles.selectedAbuserTag}>Existing</Text>
                                </View>
                                <Text style={styles.selectedAbuserMeta}>ID: {selectedAbuser.id} • Alias: {selectedAbuser.aliasName}</Text>
                                <Text style={styles.selectedAbuserMeta}>{selectedAbuser.gender}{selectedAbuser.age ? ` • Age ${selectedAbuser.age}` : ''}</Text>
                                <Text style={styles.selectedAbuserMeta}>{selectedAbuser.phone}</Text>
                                <Text style={styles.selectedAbuserMeta}>{selectedAbuser.address}</Text>
                            </View>
                        </View>
                    )}

                    {!selectedAbuser && <SectionDivider title="Abuser Identity" />}

                    {!selectedAbuser && (
                        <View style={styles.profilePhotoCard}>
                            <Text style={styles.profilePhotoTitle}>Abuser Display Picture</Text>
                            <View style={styles.profilePhotoRow}>
                                <View style={styles.profileAvatarOuter}>
                                    {abuserPhoto
                                        ? <Image source={{ uri: abuserPhoto.uri }} style={styles.profileAvatarImage} />
                                        : <View style={styles.profileAvatarEmpty}><Text style={styles.profileAvatarIcon}>📷</Text></View>
                                    }
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profilePhotoHint}>Upload profile image for quick visual identification.</Text>
                                    <View style={styles.profilePhotoActions}>
                                        <PrimaryButton title={abuserPhoto ? 'Change Photo' : 'Upload Photo'} onPress={handlePickAbuserPhoto} style={styles.photoUploadBtn} />
                                        {!!abuserPhoto && <PrimaryButton title="Remove" variant="outline" onPress={() => setAbuserPhoto(null)} style={styles.photoRemoveBtn} />}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {!selectedAbuser && (
                        <>
                            <FormField label="Full Name" required error={errors.fullName}>
                                <StyledInput placeholder="Enter full legal name" value={form.fullName} onChangeText={v => set('fullName', v)} error={errors.fullName} />
                            </FormField>
                            <FormField label="Known Alias / Nickname">
                                <StyledInput placeholder="e.g. Street name or nickname" value={form.aliasName} onChangeText={v => set('aliasName', v)} />
                            </FormField>
                            <View style={styles.row}>
                                <FormField label="Gender" style={styles.halfField}>
                                    <StyledInput placeholder="e.g. Male / Female" value={form.gender} onChangeText={v => set('gender', v)} />
                                </FormField>
                                <FormField label="Date of Birth" error={errors.dob} style={styles.halfField}>
                                    <StyledInput placeholder="YYYY-MM-DD" value={form.dob} onChangeText={v => set('dob', v)} keyboardType="numbers-and-punctuation" error={errors.dob} />
                                </FormField>
                            </View>
                            <View style={styles.row}>
                                <FormField label="Phone" style={styles.halfField}>
                                    <StyledInput placeholder="+1 555-0000" value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
                                </FormField>
                                <FormField label="Email" style={styles.halfField}>
                                    <StyledInput placeholder="Email address" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
                                </FormField>
                            </View>
                            <FormField label="Last Known Address">
                                <StyledInput placeholder="Street, city, state" value={form.address} onChangeText={v => set('address', v)} multiline />
                            </FormField>
                        </>
                    )}

                    <SectionDivider title="Incident Details" />

                    <FormField label="Type of Abuse" required error={errors.abuseType}>
                        <View style={styles.typeGrid}>
                            {ABUSE_TYPES.map(t => {
                                const active = form.abuseType === t;
                                return (
                                    <TouchableOpacity key={t} onPress={() => set('abuseType', t)} style={[styles.typeChip, active && styles.typeChipActive]} activeOpacity={0.7}>
                                        <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </FormField>

                    <View style={styles.row}>
                        <FormField label="Incident Date" required error={errors.incidentDate} style={styles.halfField}>
                            <StyledInput placeholder="YYYY-MM-DD" value={form.incidentDate} onChangeText={v => set('incidentDate', v)} keyboardType="numbers-and-punctuation" error={errors.incidentDate} />
                        </FormField>
                        <FormField label="Location" style={styles.halfField}>
                            <StyledInput placeholder="City or address" value={form.incidentLocation} onChangeText={v => set('incidentLocation', v)} />
                        </FormField>
                    </View>

                    <FormField label="Incident Description" required error={errors.description}>
                        <StyledInput placeholder="Describe what happened in detail…" value={form.description} onChangeText={v => set('description', v)} multiline style={{ minHeight: 120 }} error={errors.description} />
                    </FormField>

                    <FormField label="Witness Information">
                        <StyledInput placeholder="Names, contact info, or statements…" value={form.witnessInformation} onChangeText={v => set('witnessInformation', v)} multiline />
                    </FormField>

                    <SectionDivider title="Evidence File" />
                    <View style={styles.evidenceGrid}>
                        {EVIDENCE_TYPES.map(item => {
                            const selected = evidenceFiles[item.key];
                            return (
                                <View key={item.key} style={styles.evidenceCard}>
                                    <View style={styles.evidenceTop}>
                                        <View style={styles.evidenceHeaderRow}>
                                            <View style={styles.evidenceIconWrap}>
                                                <Icon name={item.iconName} size={18} color={appColors.primary} />
                                            </View>
                                            <View style={styles.evidenceTitleWrap}>
                                                <Text style={styles.evidenceLabel}>{item.label}</Text>
                                                <Text style={styles.evidenceHint}>{item.subtitle}</Text>
                                            </View>
                                        </View>
                                        {!!selected && <View style={styles.evidenceStatusBadge}><Text style={styles.evidenceStatusText}>Attached</Text></View>}
                                    </View>
                                    {selected ? (
                                        <>
                                            <View style={styles.evidenceFileCard}>
                                                <View style={styles.evidenceFileTopRow}>
                                                    <Icon name="insert-drive-file" size={18} color={appColors.bodyColor} />
                                                    <Text style={styles.evidenceFileName} numberOfLines={2}>{selected.name}</Text>
                                                </View>
                                                <View style={styles.evidenceMetaRow}>
                                                    <View style={styles.evidenceMetaPill}><Text style={styles.evidenceMetaPillText}>{formatMimeType(selected.mimeType)}</Text></View>
                                                    <View style={styles.evidenceMetaPill}><Text style={styles.evidenceMetaPillText}>{formatFileSize(selected.size)}</Text></View>
                                                </View>
                                                <Text style={styles.evidenceFileHelper}>Tap Change to replace this file</Text>
                                            </View>
                                            <View style={styles.evidenceActionRow}>
                                                <TouchableOpacity style={styles.evidenceSmallBtn} onPress={() => handlePickEvidence(item.key)}><Text style={styles.evidenceSmallBtnText}>Change</Text></TouchableOpacity>
                                                <TouchableOpacity style={styles.evidenceSmallBtnOutline} onPress={() => clearEvidence(item.key)}><Text style={styles.evidenceSmallBtnOutlineText}>Remove</Text></TouchableOpacity>
                                            </View>
                                        </>
                                    ) : (
                                        <TouchableOpacity style={styles.evidenceUploadBtn} onPress={() => handlePickEvidence(item.key)} activeOpacity={0.75}>
                                            <Icon name="upload-file" size={18} color={appColors.primary} />
                                            <Text style={styles.evidenceUploadText}>Attach Document</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <SectionDivider title="Risk Assessment" />

                    <FormField label="Threat Level" required error={errors.threatLevel}>
                        <SegmentControl options={THREAT_LEVELS} value={form.threatLevel} onChange={v => set('threatLevel', v)} />
                    </FormField>

                    <View style={styles.toggleCard}>
                        <ToggleRow label="History of Violence" value={form.historyOfViolence} onToggle={() => set('historyOfViolence', !form.historyOfViolence)} />
                        <View style={styles.toggleDivider} />
                        <ToggleRow label="Weapon Access" value={form.weaponAccess} onToggle={() => set('weaponAccess', !form.weaponAccess)} />
                        <View style={styles.toggleDivider} />
                        <ToggleRow label="Restraining Order in Place" value={form.restrainingOrder} onToggle={() => set('restrainingOrder', !form.restrainingOrder)} />
                    </View>

                    <SectionDivider title="Internal Notes" />

                    <FormField label="Additional Notes">
                        <StyledInput placeholder="Any additional context, updates, or case notes…" value={form.notes} onChangeText={v => set('notes', v)} multiline style={{ minHeight: 90 }} />
                    </FormField>

 <View style={styles.submitFloatingWrap}>
                    <View style={styles.submitRow}>
                        <PrimaryButton title="Reset" variant="outline" onPress={resetForm} style={styles.clearFormBtn} />
                        <PrimaryButton title={saving ? '' : 'Submit Report'} onPress={handleSubmit} loading={saving} style={styles.submitBtn} />
                    </View>
                </View>
                </ScrollView>

               
            </KeyboardAvoidingView>

            {/* ── ABUSER PICKER MODAL ─────────────────────────────────────── */}
            <Modal visible={abuserPickerOpen} transparent animationType="fade" onRequestClose={() => setAbuserPickerOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Existing Abuser</Text>
                        {abuserListLoading ? (
                            <View style={styles.modalLoaderWrap}>
                                <ActivityIndicator size="small" color={appColors.primary} />
                                <Text style={styles.modalLoaderText}>Loading abuser list...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={abuserList}
                                keyExtractor={item => item.id}
                                style={styles.modalList}
                                showsVerticalScrollIndicator={false}
                                refreshing={abuserListRefreshing}
                                onRefresh={() => fetchExistingAbusers(true)}
                                renderItem={({ item }) => (
                                    <View
                                        key={item.id}
                                        style={styles.modalRow}
                                    >
                                        {item.avatar ? <Image source={{ uri: item.avatar }} style={styles.modalAvatar} /> : <View style={styles.modalAvatarEmpty}><Text style={styles.modalAvatarIcon}>👤</Text></View>}
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.modalNameRow}>
                                                <Text style={styles.modalName}>{item.fullName}</Text>
                                            </View>
                                            <Text style={styles.modalMeta}>Alias: {item.aliasName}</Text>
                                            <Text style={styles.modalMeta}>{item.gender}{item.age ? ` • Age ${item.age}` : ''}</Text>
                                            <Text style={styles.modalMeta}>{item.phone}</Text>
                                            <Text style={styles.modalMeta}>{item.address}</Text>
                                            <View style={styles.modalActionRow}>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    style={styles.modalSelectBtn}
                                                    onPress={() => handleSelectAbuser(item)}
                                                >
                                                    <Text style={styles.modalSelectBtnText}>Select</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    style={[styles.modalDeleteBtn, deletingAbuserId === item.id && styles.modalDeleteBtnDisabled]}
                                                    onPress={() => handleDeleteAbuser(item)}
                                                    disabled={deletingAbuserId === item.id}
                                                >
                                                    {deletingAbuserId === item.id
                                                        ? <ActivityIndicator size="small" color="#fff" />
                                                        : <Text style={styles.modalDeleteBtnText}>Delete</Text>
                                                    }
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.modalEmptyWrap}>
                                        <Text style={styles.modalEmptyText}>No existing abusers found.</Text>
                                        <Text style={styles.modalEmptySubText}>Pull down to refresh the list.</Text>
                                    </View>
                                }
                            />
                        )}
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAbuserPickerOpen(false)}>
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── SUCCESS MODAL ───────────────────────────────────────────── */}
            <Modal visible={successModal.visible} transparent animationType="fade" onRequestClose={() => { }}>
                <View style={styles.successOverlay}>
                    <View style={styles.successCard}>
                        {/* Animated check circle */}
                        <View style={styles.successIconOuter}>
                            <View style={styles.successIconInner}>
                                <Icon name="check" size={36} color="#fff" />
                            </View>
                        </View>

                        <Text style={styles.successTitle}>Report Submitted</Text>
                        <Text style={styles.successSubtitle}>
                            The abuse report has been filed successfully and is now under review.
                        </Text>

                        {/* Report details summary */}
                        <View style={styles.successDetailsCard}>
                            <View style={styles.successDetailRow}>
                                <Icon name="badge" size={15} color={appColors.bodyColor} />
                                <Text style={styles.successDetailLabel}>Report ID</Text>
                                <Text style={styles.successDetailValue}>#{successModal.reportId}</Text>
                            </View>
                            <View style={styles.successDetailDivider} />
                            <View style={styles.successDetailRow}>
                                <Icon name="person" size={15} color={appColors.bodyColor} />
                                <Text style={styles.successDetailLabel}>Abuser</Text>
                                <Text style={styles.successDetailValue} numberOfLines={1}>{successModal.abuserName}</Text>
                            </View>
                            <View style={styles.successDetailDivider} />
                            <View style={styles.successDetailRow}>
                                <Icon name="schedule" size={15} color={appColors.bodyColor} />
                                <Text style={styles.successDetailLabel}>Filed on</Text>
                                <Text style={styles.successDetailValue}>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.successActionCol}>
                            <TouchableOpacity
                                style={styles.successBtnPrimary}
                                activeOpacity={0.85}
                                onPress={() => {
                                    setSuccessModal({ visible: false, reportId: null, abuserName: '' });
                                    navigation.navigate('ReportList'); // adjust route name to match your navigator
                                }}
                            >
                                <Icon name="list-alt" size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.successBtnPrimaryText}>Go to Report List</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.successBtnOutline}
                                activeOpacity={0.75}
                                onPress={() => {
                                    setSuccessModal({ visible: false, reportId: null, abuserName: '' });
                                    resetForm();
                                }}
                            >
                                <Icon name="add-circle-outline" size={18} color={appColors.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.successBtnOutlineText}>File Another Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {saving && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator animating={saving} size="large" color={appColors.primary} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: appColors.DarkPrimary },
    scroll: { flex: 1 },
    content: { paddingHorizontal: SW(18), paddingTop: SW(8), paddingBottom: SW(32) },

    // ── Header — mirrors AddContactsScreen ──
    headerWrap: { paddingHorizontal: SW(18), paddingTop: SW(48) },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: SW(16) },
    headerTextWrap: { flex: 1, marginLeft: SW(10) },
    headerTitle: { color: appColors.white, fontSize: SF(17), fontFamily: appFonts.NunitoBold },
    headerSubtitle: { color: appColors.bodyColor, fontSize: SF(10), fontFamily: appFonts.NunitoSemiBold },

    // ── Sections ──
    row: { flexDirection: 'row', gap: SW(12) },
    halfField: { flex: 1 },

    // ── Selection card — mirrors inputBox style ──
    selectionCard: {
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(14),
        borderWidth: 0.7,
        borderColor: appColors.primary,
        padding: SW(14),
        marginBottom: SW(14),
    },
    selectionCardTitle: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold, marginBottom: 6 },
    selectionCardBody: { color: appColors.bodyColor, fontSize: SF(11), marginBottom: SW(12) },
    selectionActionRow: { flexDirection: 'row', gap: SW(12) },
    selectionPrimaryBtn: { flex: 2 },
    selectionSecondaryBtn: { flex: 1 },

    // ── Selected abuser card ──
    selectedAbuserCard: {
        flexDirection: 'row',
        gap: SW(12),
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(14),
        borderWidth: 0.7,
        borderColor: appColors.primary,
        padding: SW(14),
        marginBottom: SW(20),
    },
    selectedAbuserAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: appColors.primary },
    selectedAbuserTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    selectedAbuserName: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold, flexShrink: 1, paddingRight: 8 },
    selectedAbuserTag: { color: appColors.white, fontSize: SF(10), fontFamily: appFonts.NunitoBold, backgroundColor: appColors.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    selectedAbuserMeta: { color: appColors.bodyColor, fontSize: SF(11), lineHeight: 18 },

    // ── Profile photo card ──
    profilePhotoCard: {
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(14),
        borderWidth: 0.7,
        borderColor: appColors.primary,
        padding: SW(14),
        marginBottom: SW(14),
    },
    profilePhotoTitle: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold, marginBottom: SW(10) },
    profilePhotoRow: { flexDirection: 'row', gap: SW(12), alignItems: 'center' },
    profileAvatarOuter: { width: 72, height: 72 },
    profileAvatarEmpty: {
        width: 72, height: 72, borderRadius: 36,
        borderWidth: 0.7, borderColor: appColors.primary,
        backgroundColor: appColors.primaryAA,
        alignItems: 'center', justifyContent: 'center',
    },
    profileAvatarImage: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: appColors.primary },
    profileAvatarIcon: { fontSize: 22 },
    profilePhotoHint: { color: appColors.bodyColor, fontSize: SF(11), marginBottom: SW(10) },
    profilePhotoActions: { flexDirection: 'row', gap: SW(12) },
    photoUploadBtn: { flex: 2 },
    photoRemoveBtn: { flex: 1 },

    // ── Abuse type chips — mirrors relationTab ──
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SW(8) },
    typeChip: {
        paddingHorizontal: SW(14), paddingVertical: SW(8),
        borderRadius: SW(20), borderWidth: 1,
        borderColor: '#1A2438', backgroundColor: appColors.primaryAA,
    },
    typeChipActive: { backgroundColor: '#4A1018', borderColor: appColors.primary },
    typeChipText: { color: appColors.bodyColor, fontSize: SF(12) },
    typeChipTextActive: { color: appColors.white, fontFamily: appFonts.NunitoBold },

    // ── Toggle card — mirrors toggleCard ──
    toggleCard: {
        backgroundColor: appColors.whiteTransparent,
        borderRadius: SW(14),
        borderWidth: 1,
        borderColor: appColors.whiteBdrTransparent,
        paddingHorizontal: SW(14),
        marginBottom: SW(14),
    },
    toggleDivider: { height: 1, backgroundColor: appColors.whiteBdrTransparent },

    // ── Evidence cards ──
    evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SW(12), marginBottom: SW(20) },
    evidenceCard: {
        flexGrow: 1, flexBasis: '30%', minWidth: 160,
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(14), borderWidth: 0.7,
        borderColor: appColors.primary,
        padding: SW(12), minHeight: 200,
    },
    evidenceTop: { marginBottom: SW(12) },
    evidenceHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    evidenceTitleWrap: { flex: 1 },
    evidenceIconWrap: {
        backgroundColor: appColors.primaryAA,
        borderRadius: 999, width: 34, height: 34,
        alignItems: 'center', justifyContent: 'center',
        marginRight: SW(10), borderWidth: 0.7, borderColor: appColors.primary,
    },
    evidenceLabel: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },
    evidenceHint: { color: appColors.bodyColor, fontSize: SF(10), marginTop: 2, lineHeight: 16 },
    evidenceStatusBadge: {
        alignSelf: 'flex-start', marginTop: SW(10),
        backgroundColor: appColors.primaryAA,
        borderWidth: 0.7, borderColor: appColors.primary,
        borderRadius: SW(6), paddingHorizontal: 8, paddingVertical: 3,
    },
    evidenceStatusText: { color: appColors.white, fontSize: SF(10), fontFamily: appFonts.NunitoBold },
    evidenceFileCard: {
        borderWidth: 0.7, borderColor: appColors.primary,
        borderRadius: SW(10), backgroundColor: appColors.primaryAA,
        padding: SW(11), marginBottom: SW(10),
    },
    evidenceFileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    evidenceFileName: { color: appColors.bodyColor, fontSize: SF(11), fontFamily: appFonts.NunitoBold, lineHeight: 18, flex: 1 },
    evidenceMetaRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    evidenceMetaPill: {
        borderWidth: 0.7, borderColor: appColors.primary,
        borderRadius: SW(6), paddingHorizontal: 7, paddingVertical: 3,
        backgroundColor: appColors.primaryAA,
    },
    evidenceMetaPillText: { color: appColors.bodyColor, fontSize: SF(10), fontFamily: appFonts.NunitoBold },
    evidenceFileHelper: { color: appColors.bodyColor, fontSize: SF(10), lineHeight: 15 },
    evidenceUploadBtn: {
        flexDirection: 'row', gap: 6, marginTop: 'auto',
        borderWidth: 0.7, borderColor: appColors.primary,
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(10), paddingVertical: SW(11),
        alignItems: 'center', justifyContent: 'center',
    },
    evidenceUploadText: { color: appColors.white, fontSize: SF(11), fontFamily: appFonts.NunitoBold },
    evidenceActionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
    evidenceSmallBtn: {
        flex: 1, backgroundColor: appColors.primary,
        borderRadius: SW(10), alignItems: 'center', paddingVertical: SW(8),
    },
    evidenceSmallBtnText: { color: appColors.white, fontSize: SF(11), fontFamily: appFonts.NunitoBold },
    evidenceSmallBtnOutline: {
        flex: 1, borderWidth: 0.7, borderColor: appColors.primary,
        borderRadius: SW(10), alignItems: 'center', paddingVertical: SW(8),
    },
    evidenceSmallBtnOutlineText: { color: appColors.bodyColor, fontSize: SF(11), fontFamily: appFonts.NunitoBold },

    // ── Submit row ──
    submitFloatingWrap: {
        marginTop: SW(14), marginBottom: SW(8),
        backgroundColor: appColors.whiteTransparent,
        borderWidth: 1, borderColor: appColors.whiteBdrTransparent,
        borderRadius: SW(14), padding: SW(14),
    },
    submitRow: { flexDirection: 'row', gap: SW(12) },
    clearFormBtn: { flex: 1 },
    submitBtn: { flex: 2 },

    // ── Abuser picker modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', padding: SW(18), justifyContent: 'center' },
    modalCard: {
        backgroundColor: appColors.DarkPrimary,
        borderRadius: SW(14), borderWidth: 0.7,
        borderColor: appColors.primary,
        maxHeight: '82%', padding: SW(14),
    },
    modalTitle: { color: appColors.white, fontSize: SF(15), fontFamily: appFonts.NunitoBold, marginBottom: SW(14) },
    modalList: { maxHeight: 420 },
    modalLoaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: SW(24) },
    modalLoaderText: { color: appColors.bodyColor, fontSize: SF(11), marginTop: 8 },
    modalEmptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: SW(24) },
    modalEmptyText: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },
    modalEmptySubText: { color: appColors.bodyColor, fontSize: SF(11), marginTop: 4 },
    modalRow: {
        flexDirection: 'row', gap: SW(12),
        borderWidth: 0.7, borderColor: appColors.primary,
        borderRadius: SW(14), padding: SW(12),
        marginBottom: SW(8), backgroundColor: appColors.primaryAA,
    },
    modalAvatar: { width: 54, height: 54, borderRadius: 27 },
    modalAvatarEmpty: {
        width: 54, height: 54, borderRadius: 27,
        borderWidth: 0.7, borderColor: appColors.primary,
        backgroundColor: appColors.primaryAA,
        alignItems: 'center', justifyContent: 'center',
    },
    modalAvatarIcon: { fontSize: 20 },
    modalNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    modalName: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold, flexShrink: 1, paddingRight: 8 },
    modalRisk: { color: appColors.primary, fontSize: SF(11), fontFamily: appFonts.NunitoBold },
    modalMeta: { color: appColors.bodyColor, fontSize: SF(11), lineHeight: 17 },
    modalActionRow: { flexDirection: 'row', gap: 8, marginTop: SW(8) },
    modalSelectBtn: {
        flex: 1, backgroundColor: appColors.primary,
        borderRadius: SW(10), alignItems: 'center',
        justifyContent: 'center', paddingVertical: SW(8),
    },
    modalSelectBtnText: { color: appColors.white, fontSize: SF(11), fontFamily: appFonts.NunitoBold },
    modalDeleteBtn: {
        flex: 1, backgroundColor: '#DC2626',
        borderRadius: SW(10), alignItems: 'center',
        justifyContent: 'center', paddingVertical: SW(8),
    },
    modalDeleteBtnDisabled: { opacity: 0.7 },
    modalDeleteBtnText: { color: appColors.white, fontSize: SF(11), fontFamily: appFonts.NunitoBold },
    modalCloseBtn: {
        marginTop: SW(12), backgroundColor: appColors.primary,
        borderRadius: SW(14), alignItems: 'center', paddingVertical: SW(11),
    },
    modalCloseText: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },

    // ── Success modal ──
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SW(18),
    },
    successCard: {
        width: '100%',
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(20),
        borderWidth: 0.7,
        borderColor: appColors.primary,
        padding: SW(24),
        alignItems: 'center',
    },
    successIconOuter: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(34,197,94,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: SW(16), borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.3)',
    },
    successIconInner: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#22C55E',
        alignItems: 'center', justifyContent: 'center',
    },
    successTitle: {
        fontSize: SF(19), fontFamily: appFonts.NunitoBold,
        color: appColors.white, marginBottom: 8, textAlign: 'center',
    },
    successSubtitle: {
        color: appColors.bodyColor, fontSize: SF(12),
        textAlign: 'center', lineHeight: 20,
        marginBottom: SW(20), paddingHorizontal: SW(8),
    },
    successDetailsCard: {
        width: '100%', backgroundColor: appColors.DarkPrimary,
        borderRadius: SW(14), borderWidth: 0.7,
        borderColor: appColors.primary,
        paddingHorizontal: SW(14), marginBottom: SW(20),
    },
    successDetailRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SW(12), gap: 8,
    },
    successDetailDivider: { height: 1, backgroundColor: appColors.primary, opacity: 0.3 },
    successDetailLabel: { color: appColors.bodyColor, fontSize: SF(11), flex: 1 },
    successDetailValue: {
        color: appColors.white, fontSize: SF(11),
        fontFamily: appFonts.NunitoBold, maxWidth: '55%', textAlign: 'right',
    },
    successActionCol: { width: '100%', gap: SW(12) },
    successBtnPrimary: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: appColors.primary, borderRadius: SW(14), paddingVertical: SW(14),
    },
    successBtnPrimaryText: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },
    successBtnOutline: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 0.7, borderColor: appColors.primary,
        backgroundColor: appColors.primaryAA,
        borderRadius: SW(14), paddingVertical: SW(14),
    },
    successBtnOutlineText: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },

    // ── Test data toggle (dev only) ──
    testDataToggle: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: appColors.primaryAA, borderRadius: SW(14),
        borderWidth: 0.7, borderColor: appColors.primary,
        borderStyle: 'dashed', paddingHorizontal: SW(14),
        paddingVertical: SW(10), marginBottom: SW(14),
    },
    testDataToggleActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.06)', borderStyle: 'solid' },
    testDataToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SW(12), flex: 1 },
    testDataDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: appColors.bodyColor },
    testDataDotActive: { backgroundColor: '#F59E0B' },
    testDataToggleLabel: { fontSize: SF(13), fontFamily: appFonts.NunitoBold, color: appColors.bodyColor },
    testDataToggleLabelActive: { color: '#F59E0B' },
    testDataToggleHint: { fontSize: SF(11), color: appColors.bodyColor, marginTop: 2 },
    testDataPill: {
        borderWidth: 0.7, borderColor: appColors.primary,
        borderRadius: SW(6), paddingHorizontal: 8, paddingVertical: 3,
        backgroundColor: appColors.primaryAA,
    },
    testDataPillActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.12)' },
    testDataPillText: { fontSize: SF(10), fontFamily: appFonts.NunitoBold, color: appColors.bodyColor, letterSpacing: 0.5 },
    testDataPillTextActive: { color: '#F59E0B' },

    // ── Reset button (unused now, kept for safety) ──
    resetButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: SW(12), paddingVertical: SW(9),
        borderRadius: SW(999), backgroundColor: appColors.primaryAA,
        borderWidth: 0.7, borderColor: appColors.primary,
    },
    resetButtonText: { color: appColors.white, fontSize: SF(11), fontFamily: appFonts.NunitoBold },
});
