import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { supabase, RELATIONSHIP_STATUS_LABELS, RELATIONSHIP_STATUSES_WITH_PARTNER, RelationshipStatusType } from "@/lib/supabase";
import { Heart, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MutualFollower {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
}

interface RelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelationshipDialog = ({ isOpen, onClose }: RelationshipDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([]);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [selectedStatusType, setSelectedStatusType] = useState<RelationshipStatusType>('single');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [step, setStep] = useState<'select-type' | 'select-partner'>('select-type');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchData = async () => {
      const { data: statusData } = await supabase
        .from('relationship_statuses')
        .select('*')
        .eq('user_id', user.uid)
        .maybeSingle();

      if (statusData) {
        setCurrentStatus(statusData);
        setSelectedStatusType(statusData.status_type);
        setSelectedPartner(statusData.partner_id);
      } else {
        setCurrentStatus(null);
        setSelectedStatusType('single');
        setSelectedPartner(null);
      }

      const { data: requests } = await supabase
        .from('relationship_statuses')
        .select('*')
        .eq('partner_id', user.uid)
        .eq('partner_accepted', false);

      setPendingRequests(requests || []);

      const followersRef = ref(database, `followers/${user.uid}`);
      const followingRef = ref(database, `following/${user.uid}`);

      const [followersSnapshot, followingSnapshot] = await Promise.all([
        get(followersRef),
        get(followingRef),
      ]);

      if (followersSnapshot.exists() && followingSnapshot.exists()) {
        const followerIds = Object.keys(followersSnapshot.val());
        const followingIds = Object.keys(followingSnapshot.val());
        const mutualIds = followerIds.filter((id) => followingIds.includes(id));

        const mutualUsers: MutualFollower[] = [];
        for (const uid of mutualIds) {
          const userRef = ref(database, `users/${uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            mutualUsers.push({
              uid,
              ...snapshot.val(),
            });
          }
        }
        setMutualFollowers(mutualUsers);
      }
    };

    fetchData();
  }, [isOpen, user]);

  const handleStatusTypeChange = (value: RelationshipStatusType) => {
    setSelectedStatusType(value);
    if (RELATIONSHIP_STATUSES_WITH_PARTNER.includes(value)) {
      setStep('select-partner');
    } else {
      setSelectedPartner(null);
    }
  };

  const handleSaveStatus = async () => {
    if (!user) return;

    try {
      const needsPartner = RELATIONSHIP_STATUSES_WITH_PARTNER.includes(selectedStatusType);

      if (needsPartner && !selectedPartner) {
        toast({
          title: "Partner required",
          description: "Please select a partner for this relationship status.",
          variant: "destructive",
        });
        return;
      }

      if (currentStatus) {
        await supabase
          .from('relationship_statuses')
          .update({
            status_type: selectedStatusType,
            partner_id: needsPartner ? selectedPartner : null,
            partner_accepted: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.uid);
      } else {
        await supabase
          .from('relationship_statuses')
          .insert({
            user_id: user.uid,
            status_type: selectedStatusType,
            partner_id: needsPartner ? selectedPartner : null,
            partner_accepted: false,
          });
      }

      if (needsPartner && selectedPartner) {
        const { data: partnerStatus } = await supabase
          .from('relationship_statuses')
          .select('*')
          .eq('user_id', selectedPartner)
          .maybeSingle();

        if (!partnerStatus) {
          await supabase
            .from('relationship_statuses')
            .insert({
              user_id: selectedPartner,
              status_type: selectedStatusType,
              partner_id: user.uid,
              partner_accepted: false,
            });
        } else {
          await supabase
            .from('relationship_statuses')
            .update({
              status_type: selectedStatusType,
              partner_id: user.uid,
              partner_accepted: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', selectedPartner);
        }
      }

      toast({
        title: "Relationship status updated",
        description: needsPartner
          ? "Your partner will need to confirm the relationship status."
          : "Your relationship status has been updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update relationship status.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('relationship_statuses')
        .update({ partner_accepted: true })
        .eq('id', requestId);

      await supabase
        .from('relationship_statuses')
        .update({ partner_accepted: true })
        .eq('user_id', user.uid)
        .eq('partner_id', requesterId);

      toast({
        title: "Request accepted",
        description: "Relationship status confirmed!",
      });

      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept request.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('relationship_statuses')
        .delete()
        .eq('id', requestId);

      await supabase
        .from('relationship_statuses')
        .delete()
        .eq('user_id', user.uid)
        .eq('partner_accepted', false);

      toast({
        title: "Request rejected",
        description: "Relationship status request declined.",
      });

      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStatus = async () => {
    if (!user || !currentStatus) return;

    try {
      if (currentStatus.partner_id) {
        await supabase
          .from('relationship_statuses')
          .delete()
          .eq('user_id', currentStatus.partner_id)
          .eq('partner_id', user.uid);
      }

      await supabase
        .from('relationship_statuses')
        .delete()
        .eq('user_id', user.uid);

      setCurrentStatus(null);
      setSelectedStatusType('single');
      setSelectedPartner(null);
      setStep('select-type');

      toast({
        title: "Relationship status cleared",
        description: "Your relationship status has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear relationship status.",
        variant: "destructive",
      });
    }
  };

  const getPartnerData = async (partnerId: string) => {
    const userRef = ref(database, `users/${partnerId}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  };

  const [partnerData, setPartnerData] = useState<any>(null);

  useEffect(() => {
    if (currentStatus?.partner_id) {
      getPartnerData(currentStatus.partner_id).then(setPartnerData);
    }
  }, [currentStatus]);

  useEffect(() => {
    pendingRequests.forEach(async (request) => {
      const data = await getPartnerData(request.user_id);
      setPendingRequests(prev =>
        prev.map(r => r.id === request.id ? { ...r, userData: data } : r)
      );
    });
  }, [pendingRequests.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Relationship Status</DialogTitle>
        </DialogHeader>

        {pendingRequests.length > 0 && (
          <div className="space-y-2 mb-4 p-3 bg-muted rounded-lg">
            <Label>Pending Requests</Label>
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-2 bg-background rounded">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {request.userData?.photoURL ? (
                      <AvatarImage src={request.userData.photoURL} alt={request.userData.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {request.userData?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-semibold">{request.userData?.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {RELATIONSHIP_STATUS_LABELS[request.status_type as RelationshipStatusType]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600"
                    onClick={() => handleAcceptRequest(request.id, request.user_id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentStatus && (
          <div className="space-y-4 mb-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between mb-2">
                <Label>Current Status</Label>
                {currentStatus.partner_id && (
                  <Badge variant={currentStatus.partner_accepted ? "default" : "secondary"}>
                    {currentStatus.partner_accepted ? "Confirmed" : "Pending"}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold">
                {RELATIONSHIP_STATUS_LABELS[currentStatus.status_type as RelationshipStatusType]}
              </p>
              {partnerData && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-8 w-8">
                    {partnerData.photoURL ? (
                      <AvatarImage src={partnerData.photoURL} alt={partnerData.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {partnerData.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm">{partnerData.displayName}</span>
                </div>
              )}
            </div>
            <Button variant="destructive" onClick={handleRemoveStatus} className="w-full">
              Clear Relationship Status
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <Select value={selectedStatusType} onValueChange={handleStatusTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="in_relationship">In a relationship</SelectItem>
                <SelectItem value="engaged">Engaged</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="civil_union">Civil union</SelectItem>
                <SelectItem value="domestic_partnership">Domestic partnership</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
                <SelectItem value="its_complicated">It's complicated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {step === 'select-partner' && (
            <div className="space-y-2">
              <Label>Select Partner</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {mutualFollowers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No mutual followers available
                  </p>
                ) : (
                  mutualFollowers.map((person) => (
                    <div
                      key={person.uid}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                        selectedPartner === person.uid ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedPartner(person.uid)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {person.photoURL ? (
                            <AvatarImage src={person.photoURL} alt={person.username} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {person.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{person.displayName}</p>
                          <p className="text-muted-foreground text-xs">@{person.username}</p>
                        </div>
                      </div>
                      {selectedPartner === person.uid && (
                        <Heart className="h-5 w-5 text-primary fill-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(step === 'select-type' && !RELATIONSHIP_STATUSES_WITH_PARTNER.includes(selectedStatusType)) && (
            <Button onClick={handleSaveStatus} className="w-full">
              Save Status
            </Button>
          )}

          {step === 'select-partner' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('select-type');
                  setSelectedPartner(null);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleSaveStatus} className="flex-1" disabled={!selectedPartner}>
                Save Status
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RelationshipDialog;
