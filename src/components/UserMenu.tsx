import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User, ChevronDown, SwitchCamera, Settings, Camera, X } from 'lucide-react';

export function UserMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<{
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clientData } = await supabase
        .from('clients')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (clientData) {
        setUserData(clientData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update user profile
      const { error: updateError } = await supabase
        .from('clients')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUserData(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setShowImageModal(false);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSwitchAccount = () => {
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/client/profile/edit');
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        >
          <div 
            className="relative w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center overflow-hidden group cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(true);
            }}
          >
            {userData?.avatar_url ? (
              <img 
                src={userData.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-blue-600" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
              <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="font-medium">{userData?.full_name || 'User'}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              {userData?.email}
            </div>
            <button
              onClick={handleEditProfile}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
            <button
              onClick={handleSwitchAccount}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <SwitchCamera className="w-4 h-4 mr-2" />
              Switch Account
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>

      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Profile Picture</h3>
              <button 
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              {userData?.avatar_url && (
                <img 
                  src={userData.avatar_url} 
                  alt="Current profile" 
                  className="w-32 h-32 rounded-lg mx-auto mb-4 object-cover"
                />
              )}
            </div>

            <div className="flex flex-col items-center">
              <label className="w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <div className="w-full py-2 px-4 text-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                  <Camera className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {uploading ? 'Uploading...' : 'Click to upload new picture'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}