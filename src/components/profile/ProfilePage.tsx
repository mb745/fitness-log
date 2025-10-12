import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import PersonalTab from "./tabs/PersonalTab";
import LimitationsTab from "./tabs/LimitationsTab";
import PreferencesTab from "./tabs/PreferencesTab";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ProfilePageInner: React.FC = () => {
  return (
    <div>
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Dane osobowe</TabsTrigger>
          <TabsTrigger value="limitations">Ograniczenia</TabsTrigger>
          <TabsTrigger value="account">Konto</TabsTrigger>
          <TabsTrigger value="preferences">Preferencje</TabsTrigger>
          <TabsTrigger value="about">O aplikacji</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PersonalTab />
        </TabsContent>
        <TabsContent value="limitations">
          <LimitationsTab />
        </TabsContent>
        <TabsContent value="account">
          <p>TODO AccountTab</p>
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="about">
          <p>TODO AboutTab</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>
      <QueryClientProvider client={queryClient}>
        <ProfilePageInner />
      </QueryClientProvider>
    </div>
  );
};

export default ProfilePage;
